const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get, all } = require('../db-helper');

const router = express.Router();
const JWT_SECRET = 'dab-enterprise-secret-key-2026';

router.post('/login', async (req, res, next) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await get('SELECT * FROM users WHERE userName = ?', [userName]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userid: user.userid, userName: user.userName }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { userid: user.userid, userName: user.userName } });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existing = await get('SELECT * FROM users WHERE userName = ?', [userName]);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const result = await run('INSERT INTO users (userName, password) VALUES (?, ?)', [userName, hashed]);
    res.status(201).json({ userid: result.lastInsertRowid, userName });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const users = await all('SELECT userid, userName FROM users');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
