const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

let pool = null;

function getPool() {
  return pool;
}

async function initDatabase() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'sms',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const connection = await pool.getConnection();
  console.log('Connected to MySQL database');
  connection.release();

  const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM users');
  if (rows[0].count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await pool.execute('INSERT INTO users (userName, password) VALUES (?, ?)', ['admin', hashedPassword]);
    console.log('Default admin user created (username: admin, password: admin123)');
  }

  return pool;
}

module.exports = { getPool, initDatabase };
