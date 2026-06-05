const express = require('express');
const { run, get, all } = require('../db-helper');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { startDate, endDate } = req.query;
  let query = `
    SELECT so.*, u.userName, si.itemname
    FROM stockout so
    JOIN users u ON so.userId = u.userid
    JOIN stockin si ON so.stockInId = si.stockinId
  `;
  const conditions = [];
  const params = [];

  if (startDate) {
    conditions.push('so.stockoutDate >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('so.stockoutDate <= ?');
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY so.stockoutDate DESC';

  const records = all(query, params);
  res.json(records);
});

router.get('/available-items', authenticate, (req, res) => {
  const items = all(`
    SELECT
      si.stockinId,
      si.itemname,
      si.description,
      si.quantityin - COALESCE((
        SELECT SUM(so.quantityout)
        FROM stockout so
        WHERE so.stockInId = si.stockinId
      ), 0) AS availableQty
    FROM stockin si
    WHERE si.quantityin - COALESCE((
        SELECT SUM(so.quantityout)
        FROM stockout so
        WHERE so.stockInId = si.stockinId
      ), 0) > 0
    ORDER BY si.itemname
  `);

  res.json(items);
});

router.put('/:id', authenticate, (req, res) => {
  const { stockInId, quantityout, stockoutDate } = req.body;
  const existing = get('SELECT * FROM stockout WHERE stockoutId = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Stock out record not found' });
  }

  run(
    `UPDATE stockout SET stockInId=?, quantityout=?, stockoutDate=? WHERE stockoutId=?`,
    [
      stockInId || existing.stockInId,
      quantityout !== undefined ? Number(quantityout) : existing.quantityout,
      stockoutDate || existing.stockoutDate,
      req.params.id,
    ]
  );

  const record = get(
    `SELECT so.*, u.userName, si.itemname
     FROM stockout so
     JOIN users u ON so.userId = u.userid
     JOIN stockin si ON so.stockInId = si.stockinId
     WHERE so.stockoutId = ?`,
    [req.params.id]
  );
  res.json(record);
});

router.delete('/:id', authenticate, (req, res) => {
  const existing = get('SELECT * FROM stockout WHERE stockoutId = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Stock out record not found' });
  }
  run('DELETE FROM stockout WHERE stockoutId = ?', [req.params.id]);
  res.json({ message: 'Stock out record deleted' });
});

router.post('/', authenticate, (req, res) => {
  const { stockInId, quantityout, stockoutDate } = req.body;
  if (!stockInId || !quantityout || !stockoutDate) {
    return res.status(400).json({ error: 'Stock in ID, quantity, and date are required' });
  }

  const stockIn = get('SELECT * FROM stockin WHERE stockinId = ?', [stockInId]);
  if (!stockIn) {
    return res.status(404).json({ error: 'Stock record not found' });
  }

  const issuedSoFar = get(
    'SELECT COALESCE(SUM(quantityout), 0) AS total FROM stockout WHERE stockInId = ?',
    [stockInId]
  );

  const available = stockIn.quantityin - (issuedSoFar ? issuedSoFar.total : 0);
  if (Number(quantityout) > available) {
    return res.status(400).json({ error: `Not enough stock. Available: ${available}` });
  }

  const totalIssuedSoFar = get(
    `SELECT COALESCE(SUM(so.quantityout), 0) AS total
     FROM stockout so
     JOIN stockin si ON so.stockInId = si.stockinId
     WHERE si.itemname = (SELECT itemname FROM stockin WHERE stockinId = ?)`,
    [stockInId]
  );

  const itemTotalReceived = get(
    `SELECT SUM(quantityin) AS total FROM stockin WHERE itemname = (SELECT itemname FROM stockin WHERE stockinId = ?)`,
    [stockInId]
  );

  const totalquantityout = Number(itemTotalReceived.total) - Number(totalIssuedSoFar.total) - Number(quantityout);

  const result = run(
    `INSERT INTO stockout (stockInId, userId, stockoutDate, totalquantityout, quantityout)
     VALUES (?, ?, ?, ?, ?)`,
    [stockInId, req.user.userid, stockoutDate, Math.max(0, totalquantityout), Number(quantityout)]
  );

  const record = get(
    `SELECT so.*, u.userName, si.itemname
     FROM stockout so
     JOIN users u ON so.userId = u.userid
     JOIN stockin si ON so.stockInId = si.stockinId
     WHERE so.stockoutId = ?`,
    [result.lastInsertRowid]
  );

  res.status(201).json(record);
});

module.exports = router;
