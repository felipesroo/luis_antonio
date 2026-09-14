const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const sqlFile = path.join(__dirname, 'Deal.sql');
  if (!fs.existsSync(sqlFile)) {
    console.log(`Arquivo ${sqlFile} não encontrado.`);
    return;
  }
  console.log(`Lendo arquivo de backup: ${sqlFile}...`);
  let sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('Ajustando comandos INSERT para a tabela ofertastop...');
  sql = sql.replaceAll('INSERT INTO Deal (', 'INSERT INTO ofertastop (');

  console.log('Limpando dados antigos da tabela ofertastop (se houver)...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "ofertastop" CASCADE;');

  console.log('Processando queries de inserção...');
  const rawStatements = sql.split(/\);\r?\n/);
  const queries = [];
  for (let s of rawStatements) {
    s = s.trim();
    if (s.length === 0) continue;
    if (!s.endsWith(';')) {
      s += ');';
    }
    queries.push(s);
  }

  console.log(`Total de registros detectados: ${queries.length}`);
  console.log('Restaurando dados no PostgreSQL de produção... Isso pode levar alguns segundos.');

  const batchSize = 200;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    await prisma.$transaction(
      batch.map(query => prisma.$executeRawUnsafe(query))
    );
    console.log(`Progresso: ${Math.min(i + batchSize, queries.length)} / ${queries.length} registros inseridos.`);
  }

  console.log('Restauração concluída com sucesso!');
}

main()
  .catch(e => {
    console.error('Erro na restauração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
