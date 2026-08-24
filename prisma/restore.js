const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://postgres:Automacao@2026!SuperSegura@2.25.152.195:5433/promofamily'
    }
  }
});

async function main() {
  const sqlFile = 'C:\\Users\\Felipe\\Downloads\\Deal.sql';
  console.log(`Lendo arquivo de backup: ${sqlFile}...`);
  let sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('Ajustando comandos INSERT para a tabela promofamily...');
  sql = sql.replaceAll('INSERT INTO Deal (', 'INSERT INTO promofamily (');

  console.log('Limpando dados antigos da tabela promofamily (se houver)...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "promofamily" CASCADE;');

  console.log('Processando queries de inserção...');
  const rawStatements = sql.split(/\);\r?\n/);
  const queries = [];
  for (let s of rawStatements) {
    s = s.trim();
    if (s.length === 0) continue;
    // Add the closing parenthesis and semicolon if they were removed by split
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
