const express = require('express');
const { run, get, all } = require('../db-helper');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { itemname, startDate, endDate } = req.query;
    let query = `
      SELECT s.*, u.userName
      FROM stockin s
      JOIN users u ON s.userId = u.userid
    `;
    const conditions = [];
    const params = [];

    if (itemname) {
      conditions.push('s.itemname LIKE ?');
      params.push(`%${itemname}%`);
    }
    if (startDate) {
      conditions.push('s.stockindate >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('s.stockindate <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY s.stockindate DESC';

    const records = await all(query, params);
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { itemname, description, quantityin, suppliername, stockindate } = req.body;
    const existing = await get('SELECT * FROM stockin WHERE stockinId = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Stock record not found' });
    }

    const lastStockIn = await get(
      'SELECT totalquantityin FROM stockin WHERE itemname = ? AND stockinId <= ? ORDER BY stockinId DESC LIMIT 1',
      [itemname || existing.itemname, req.params.id]
    );
    const previousTotal = lastStockIn ? lastStockIn.totalquantityin : 0;
    const newQty = quantityin !== undefined ? Number(quantityin) : existing.quantityin;
    const totalquantityin = previousTotal + newQty;

    await run(
      `UPDATE stockin SET itemname=?, description=?, quantityin=?, totalquantityin=?, suppliername=?, stockindate=? WHERE stockinId=?`,
      [
        itemname || existing.itemname,
        description !== undefined ? description : existing.description,
        newQty,
        totalquantityin,
        suppliername !== undefined ? suppliername : existing.suppliername,
        stockindate || existing.stockindate,
        req.params.id,
      ]
    );

    const record = await get(
      `SELECT s.*, u.userName FROM stockin s JOIN users u ON s.userId = u.userid WHERE s.stockinId = ?`,
      [req.params.id]
    );
    res.json(record);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM stockin WHERE stockinId = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Stock record not found' });
    }
    await run('DELETE FROM stockin WHERE stockinId = ?', [req.params.id]);
    res.json({ message: 'Stock record deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { itemname, description, quantityin, suppliername, stockindate } = req.body;
    if (!itemname || !quantityin || !stockindate) {
      return res.status(400).json({ error: 'Item name, quantity, and date are required' });
    }

    const lastStockIn = await get(
      'SELECT totalquantityin FROM stockin WHERE itemname = ? ORDER BY stockinId DESC LIMIT 1',
      [itemname]
    );

    const previousTotal = lastStockIn ? lastStockIn.totalquantityin : 0;
    const totalquantityin = previousTotal + Number(quantityin);

    const { lastInsertRowid } = await run(
      `INSERT INTO stockin (userId, itemname, description, quantityin, totalquantityin, suppliername, stockindate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userid, itemname, description || '', Number(quantityin), totalquantityin, suppliername || '', stockindate]
    );

    const record = await get(
      `SELECT s.*, u.userName FROM stockin s JOIN users u ON s.userId = u.userid WHERE s.stockinId = ?`,
      [lastInsertRowid]
    );

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

router.get('/current-stock', authenticate, async (req, res, next) => {
  try {
    const stock = await all(`
      SELECT
        s.itemname,
        s.description,
        s.totalquantityin,
        COALESCE((
          SELECT SUM(so.quantityout)
          FROM stockout so
          JOIN stockin si2 ON so.stockInId = si2.stockinId
          WHERE si2.itemname = s.itemname
        ), 0) AS totalIssued,
        s.totalquantityin - COALESCE((
          SELECT SUM(so.quantityout)
          FROM stockout so
          JOIN stockin si2 ON so.stockInId = si2.stockinId
          WHERE si2.itemname = s.itemname
        ), 0) AS currentStock
      FROM stockin s
      WHERE s.stockinId IN (
        SELECT MAX(stockinId) FROM stockin GROUP BY itemname
      )
      ORDER BY s.itemname
    `);

    res.json(stock);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
