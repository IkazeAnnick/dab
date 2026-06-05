const { getDb, saveDatabase } = require('./database');

function run(sql, params = []) {
  const db = getDb();
  db.run(sql, params);
  const lastInsertRowid = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
  saveDatabase();
  return { lastInsertRowid };
}

function get(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }
  stmt.free();
  return undefined;
}

function all(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

module.exports = { run, get, all };
