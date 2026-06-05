const { getPool } = require('./database');

async function run(sql, params = []) {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return { lastInsertRowid: result.insertId };
}

async function get(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows[0];
}

async function all(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { run, get, all };
