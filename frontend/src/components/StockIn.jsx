import { useState, useEffect } from 'react';
import { createStockIn, updateStockIn, deleteStockIn, getStockInRecords } from '../api';

const ITEMS = ['Steel bars', 'Wheelbarrows', 'Ceramic tiles',''];

export default function StockIn() {
  const [form, setForm] = useState({
    itemname: '',
    description: '',
    quantityin: '',
    suppliername: '',
    stockindate: new Date().toISOString().split('T')[0],
  });
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await getStockInRecords();
      setRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      await createStockIn(form);
      setMessage({ type: 'success', text: 'Stock recorded successfully!' });
      setForm({
        itemname: '',
        description: '',
        quantityin: '',
        suppliername: '',
        stockindate: new Date().toISOString().split('T')[0],
      });
      loadRecords();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (r) => {
    setEditRecord(r);
    setEditForm({
      itemname: r.itemname,
      description: r.description,
      quantityin: r.quantityin,
      suppliername: r.suppliername,
      stockindate: r.stockindate,
    });
  };

  const closeEdit = () => {
    setEditRecord(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateStockIn(editRecord.stockinId, editForm);
      closeEdit();
      loadRecords();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stock in record?')) return;
    try {
      await deleteStockIn(id);
      loadRecords();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="page">
      <h2>Record Stock Received</h2>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Item Name *</label>
              <select name="itemname" value={form.itemname} onChange={handleChange} required>
                <option value="">-- Select Item --</option>
                {ITEMS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="e.g. 12mm, Grade 40"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Quantity Received *</label>
              <input
                type="number"
                name="quantityin"
                value={form.quantityin}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Supplier Name</label>
              <input
                type="text"
                name="suppliername"
                value={form.suppliername}
                onChange={handleChange}
                placeholder="e.g. BuildMart Ltd"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Date Received *</label>
            <input
              type="date"
              name="stockindate"
              value={form.stockindate}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Recording...' : 'Record Stock In'}
          </button>
        </form>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Stock In History</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Qty In</th>
              <th>Total Qty</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Recorded By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-msg">No stock in records</td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.stockinId}>
                  <td>{r.itemname}</td>
                  <td>{r.description}</td>
                  <td>{r.quantityin}</td>
                  <td>{r.totalquantityin}</td>
                  <td>{r.suppliername}</td>
                  <td>{r.stockindate}</td>
                  <td>{r.userName}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(r.stockinId)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editRecord && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Stock In Record</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Item Name</label>
                <select name="itemname" value={editForm.itemname} onChange={handleEditChange} required>
                  <option value="">-- Select Item --</option>
                  {ITEMS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" name="description" value={editForm.description} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Quantity Received</label>
                <input type="number" name="quantityin" value={editForm.quantityin} onChange={handleEditChange} min="1" required />
              </div>
              <div className="form-group">
                <label>Supplier Name</label>
                <input type="text" name="suppliername" value={editForm.suppliername} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Date Received</label>
                <input type="date" name="stockindate" value={editForm.stockindate} onChange={handleEditChange} required />
              </div>
              <div className="modal-actions">
                <button type="submit">Save Changes</button>
                <button type="button" className="btn-cancel" onClick={closeEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
