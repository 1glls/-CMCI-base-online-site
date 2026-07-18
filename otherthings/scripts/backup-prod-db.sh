#!/bin/bash
#
# Sauvegarde de la base de production CMCI Belgique.
#
# Cree un instantane coherent SUR le serveur (VACUUM INTO, sans arret du
# service), le rapatrie en local, verifie son integrite et affiche son
# contenu. Conserve les N dernieres sauvegardes de chaque cote.
#
# Usage : ./otherthings/scripts/backup-prod-db.sh
#
# IMPORTANT : la sauvegarde contient des donnees personnelles (abonnes
# newsletter, soumissions de formulaires, hash des mots de passe admin).
# Elle est ecrite HORS du depot git, dans ~/CMCI-sauvegardes.
# Ne la deplacez jamais dans le depot : celui-ci est public.

set -euo pipefail

VPS_HOST="root@185.97.146.100"
VPS_BACKEND="/home/root/applications/cmci-belgique-website/src/backend"
LOCAL_DIR="$HOME/CMCI-sauvegardes"
RETENTION=10   # nombre de sauvegardes conservees de chaque cote

STAMP=$(date +%Y%m%d-%H%M%S)
NAME="dev-${STAMP}.db"

GREEN='\033[0;32m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
fail()    { echo -e "${RED}[ECHEC]${NC} $1" >&2; exit 1; }

mkdir -p "$LOCAL_DIR"

# --- 1. Instantane coherent sur le serveur ---------------------------------
# VACUUM INTO garantit un fichier utilisable meme si une ecriture a lieu
# pendant la copie. Un simple `cp` ne l'assure pas.
info "Creation de l'instantane sur le serveur..."
ssh -o BatchMode=yes "$VPS_HOST" "cd '$VPS_BACKEND' && mkdir -p backups && node -e '
const { PrismaClient } = require(\"@prisma/client\");
const p = new PrismaClient();
(async () => {
  try {
    await p.\$executeRawUnsafe(\"VACUUM INTO ?\", \"backups/$NAME\");
  } catch (e) {
    console.error(e.message); process.exit(1);
  } finally { await p.\$disconnect(); }
})();
'" || fail "Impossible de creer l'instantane sur le serveur"
success "Instantane cree : backups/$NAME"

# --- 2. Rapatriement -------------------------------------------------------
info "Telechargement..."
scp -q -o BatchMode=yes "$VPS_HOST:$VPS_BACKEND/backups/$NAME" "$LOCAL_DIR/" \
  || fail "Telechargement impossible"
success "Recu : $LOCAL_DIR/$NAME"

# --- 3. Verification -------------------------------------------------------
# Une sauvegarde non verifiee n'est pas une sauvegarde.
if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "[!] sqlite3 absent en local : verification ignoree."
else
  info "Verification de l'integrite..."
  CHECK=$(sqlite3 "$LOCAL_DIR/$NAME" "PRAGMA integrity_check;" 2>&1)
  [ "$CHECK" = "ok" ] || fail "Base corrompue : $CHECK"
  success "Integrite : ok"

  echo ""
  echo "  Contenu de la sauvegarde :"
  for t in admins events testimonials gallery_images hero_slides assemblies \
           ministries newsletter_subscribers settings forms form_submissions; do
    n=$(sqlite3 "$LOCAL_DIR/$NAME" "select count(*) from $t;" 2>/dev/null || echo "-")
    printf "    %-26s %s\n" "$t" "$n"
  done
  echo ""

  # Une base vide ou quasi vide signale un probleme en amont
  EVENTS=$(sqlite3 "$LOCAL_DIR/$NAME" "select count(*) from events;" 2>/dev/null || echo 0)
  if [ "$EVENTS" -eq 0 ]; then
    echo -e "${RED}[!] Aucun evenement : verifiez que la production est saine${NC}"
  fi
fi

# --- 4. Rotation -----------------------------------------------------------
info "Rotation (les $RETENTION plus recentes sont conservees)..."
ls -1t "$LOCAL_DIR"/dev-*.db 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm --
ssh -o BatchMode=yes "$VPS_HOST" \
  "ls -1t '$VPS_BACKEND'/backups/dev-*.db 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm --" \
  || true

echo ""
success "Sauvegarde terminee : $LOCAL_DIR/$NAME"
echo "    Sauvegardes locales : $(ls -1 "$LOCAL_DIR"/dev-*.db 2>/dev/null | wc -l)"
