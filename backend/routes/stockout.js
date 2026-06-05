const express = require('express');
const { run, get, all } = require('../db-helper');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
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

    const records = await all(query, params);
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.get('/available-items', authenticate, async (req, res, next) => {
  try {
    const items = await all(`
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
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { stockInId, quantityout, stockoutDate } = req.body;
    const existing = await get('SELECT * FROM stockout WHERE stockoutId = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Stock out record not found' });
    }

    await run(
      `UPDATE stockout SET stockInId=?, quantityout=?, stockoutDate=? WHERE stockoutId=?`,
      [
        stockInId || existing.stockInId,
        quantityout !== undefined ? Number(quantityout) : existing.quantityout,
        stockoutDate || existing.stockoutDate,
        req.params.id,
      ]
    );

    const record = await get(
      `SELECT so.*, u.userName, si.itemname
       FROM stockout so
       JOIN users u ON so.userId = u.userid
       JOIN stockin si ON so.stockInId = si.stockinId
       WHERE so.stockoutId = ?`,
      [req.params.id]
    );
    res.json(record);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM stockout WHERE stockoutId = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Stock out record not found' });
    }
    await run('DELETE FROM stockout WHERE stockoutId = ?', [req.params.id]);
    res.json({ message: 'Stock out record deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { stockInId, quantityout, stockoutDate } = req.body;
    if (!stockInId || !quantityout || !stockoutDate) {
      return res.status(400).json({ error: 'Stock in ID, quantity, and date are required' });
    }

    const stockIn = await get('SELECT * FROM stockin WHERE stockinId = ?', [stockInId]);
    if (!stockIn) {
      return res.status(404).json({ error: 'Stock record not found' });
    }

    const issuedSoFar = await get(
      'SELECT COALESCE(SUM(quantityout), 0) AS total FROM stockout WHERE stockInId = ?',
      [stockInId]
    );

    const available = stockIn.quantityin - (issuedSoFar ? issuedSoFar.total : 0);
    if (Number(quantityout) > available) {
      return res.status(400).json({ error: `Not enough stock. Available: ${available}` });
    }

    const totalIssuedSoFar = await get(
      `SELECT COALESCE(SUM(so.quantityout), 0) AS total
       FROM stockout so
       JOIN stockin si ON so.stockInId = si.stockinId
       WHERE si.itemname = (SELECT itemname FROM stockin WHERE stockinId = ?)`,
      [stockInId]
    );

    const itemTotalReceived = await get(
      `SELECT SUM(quantityin) AS total FROM stockin WHERE itemname = (SELECT itemname FROM stockin WHERE stockinId = ?)`,
      [stockInId]
    );

    const totalquantityout = Number(itemTotalReceived.total) - Number(totalIssuedSoFar.total) - Number(quantityout);

    const result = await run(
      `INSERT INTO stockout (stockInId, userId, stockoutDate, totalquantityout, quantityout)
       VALUES (?, ?, ?, ?, ?)`,
      [stockInId, req.user.userid, stockoutDate, Math.max(0, totalquantityout), Number(quantityout)]
    );

    const record = await get(
      `SELECT so.*, u.userName, si.itemname
       FROM stockout so
       JOIN users u ON so.userId = u.userid
       JOIN stockin si ON so.stockInId = si.stockinId
       WHERE so.stockoutId = ?`,
      [result.lastInsertRowid]
    );

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
