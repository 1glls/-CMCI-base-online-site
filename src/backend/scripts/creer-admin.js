#!/usr/bin/env node
/**
 * Cree un compte administrateur, ou change le mot de passe d'un compte existant,
 * directement dans la base (sans passer par l'API). A lancer SUR LE SERVEUR,
 * depuis src/backend :
 *
 *   node scripts/creer-admin.js <email> "<Nom complet>"
 *
 * Le mot de passe est demande au clavier (il ne s'affiche pas et ne reste pas
 * dans l'historique du terminal). Si l'email existe deja, seul son mot de passe
 * est remplace : pratique en cas de mot de passe oublie.
 */
require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = true;
    rl._writeToOutput = function write(s) {
      if (this.stdoutMuted && !s.startsWith(question)) this.output.write('*');
      else this.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const [email, name = 'Administrateur'] = process.argv.slice(2);
  if (!email || !email.includes('@')) {
    console.error('Usage : node scripts/creer-admin.js <email> "<Nom complet>"');
    process.exit(1);
  }
  const password = await askHidden('Mot de passe (8 caractères minimum) : ');
  if (password.length < 8) {
    console.error('❌ Mot de passe trop court (8 caractères minimum).');
    process.exit(1);
  }
  const confirm = await askHidden('Confirmez le mot de passe : ');
  if (confirm !== password) {
    console.error('❌ Les deux mots de passe ne correspondent pas.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    await prisma.admin.update({ where: { email }, data: { password: hash } });
    console.log(`✅ Mot de passe de ${email} mis à jour.`);
  } else {
    await prisma.admin.create({ data: { email, name, password: hash } });
    console.log(`✅ Compte administrateur ${email} créé.`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
