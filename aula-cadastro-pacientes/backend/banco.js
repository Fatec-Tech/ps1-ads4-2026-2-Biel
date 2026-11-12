const { Pool, types } = require('pg');

// O tipo DATE do PostgreSQL tem o código 1082.
// Por padrão o pg o converte em objeto Date (com fuso horário), o que pode
// "mudar" o dia no JSON. Aqui pedimos para manter o texto 'AAAA-MM-DD'.
types.setTypeParser(1082, (valor) => valor);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;