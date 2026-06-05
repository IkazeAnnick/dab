const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'stock.db');

let db = null;

function getDb() {
  return db;
}

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userid INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stockin (
      stockinId INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      itemname TEXT NOT NULL,
      description TEXT,
      quantityin INTEGER NOT NULL,
      totalquantityin INTEGER NOT NULL,
      suppliername TEXT,
      stockindate TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(userid)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stockout (
      stockoutId INTEGER PRIMARY KEY AUTOINCREMENT,
      stockInId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      stockoutDate TEXT NOT NULL,
      totalquantityout INTEGER NOT NULL,
      quantityout INTEGER NOT NULL,
      FOREIGN KEY (stockInId) REFERENCES stockin(stockinId),
      FOREIGN KEY (userId) REFERENCES users(userid)
    )
  `);

  const count = db.exec('SELECT COUNT(*) AS count FROM users');
  if (count.length === 0 || count[0].values[0][0] === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO users (userName, password) VALUES (?, ?)', ['admin', hashedPassword]);
    console.log('Default admin user created (username: admin, password: admin123)');
  }

  saveDatabase();
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

module.exports = { getDb, initDatabase, saveDatabase };
