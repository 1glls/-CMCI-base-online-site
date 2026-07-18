#!/bin/bash
#
# Sauvegarde hebdomadaire de la base, executee PAR LE VPS via cron.
#
# Cree un instantane coherent (VACUUM INTO, sans arret du service), applique
# la rotation, et journalise. Concu pour tourner sans surveillance : toute
# anomalie doit se lire dans le journal.
#
# Installation (crontab root) :
#   0 3 * * 0  /home/root/applications/cmci-belgique-website/otherthings/scripts/vps-weekly-backup.sh
#
# ATTENTION : ces sauvegardes restent sur le VPS. Si la machine est perdue,
# elles le sont aussi. Rapatriez-en une regulierement avec backup-prod-db.sh.

set -uo pipefail

BACKEND="/home/root/applications/cmci-belgique-website/src/backend"
BACKUP_DIR="$BACKEND/backups"
LOG="$BACKUP_DIR/backup.log"
RETENTION=8   # ~2 mois au rythme hebdomadaire

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"; }

cd "$BACKEND" || { log "ECHEC: $BACKEND introuvable"; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
NAME="dev-${STAMP}.db"

log "Debut de la sauvegarde hebdomadaire"

# VACUUM INTO plutot qu'un cp : coherent meme si une ecriture a lieu pendant
# l'operation. Passe par Prisma, qui resout le chemin de la base a partir de
# schema.prisma (et non du repertoire courant).
node -e '
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  try {
    await p.$executeRawUnsafe("VACUUM INTO ?", "backups/" + process.argv[1]);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  } finally { await p.$disconnect(); }
})();
' "$NAME" >> "$LOG" 2>&1

if [ ! -f "$BACKUP_DIR/$NAME" ]; then
  log "ECHEC: $NAME n'a pas ete cree"
  exit 1
fi

SIZE=$(stat -c%s "$BACKUP_DIR/$NAME")

# Une base anormalement petite signale un probleme en amont : on conserve le
# fichier pour analyse, mais on le signale clairement.
if [ "$SIZE" -lt 20480 ]; then
  log "ALERTE: $NAME ne fait que $SIZE octets — base potentiellement vide"
fi

log "OK: $NAME ($SIZE octets)"

# Rotation : ne supprime que nos propres fichiers, jamais le journal.
REMOVED=$(ls -1t "$BACKUP_DIR"/dev-*.db 2>/dev/null | tail -n +$((RETENTION + 1)) | wc -l)
ls -1t "$BACKUP_DIR"/dev-*.db 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm --
[ "$REMOVED" -gt 0 ] && log "Rotation: $REMOVED ancienne(s) sauvegarde(s) supprimee(s)"

KEPT=$(ls -1 "$BACKUP_DIR"/dev-*.db 2>/dev/null | wc -l)
log "Terminee — $KEPT sauvegarde(s) conservee(s)"

# Le journal lui-meme ne doit pas croitre indefiniment
if [ -f "$LOG" ] && [ "$(stat -c%s "$LOG")" -gt 102400 ]; then
  tail -n 200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
