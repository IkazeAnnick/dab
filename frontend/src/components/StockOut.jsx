import { useState, useEffect } from 'react';
import { createStockOut, updateStockOut, deleteStockOut, getStockOutRecords, getAvailableItems } from '../api';

export default function StockOut() {
  const [form, setForm] = useState({
    stockInId: '',
    quantityout: '',
    stockoutDate: new Date().toISOString().split('T')[0],
  });
  const [records, setRecords] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadRecords();
    loadAvailableItems();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await getStockOutRecords();
      setRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAvailableItems = async () => {
    try {
      const data = await getAvailableItems();
      setAvailableItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'stockInId') {
      const item = availableItems.find((i) => i.stockinId === Number(value));
      setSelectedItem(item);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      await createStockOut({
        ...form,
        stockInId: Number(form.stockInId),
        quantityout: Number(form.quantityout),
      });
      setMessage({ type: 'success', text: 'Stock issued successfully!' });
      setForm({
        stockInId: '',
        quantityout: '',
        stockoutDate: new Date().toISOString().split('T')[0],
      });
      setSelectedItem(null);
      loadRecords();
      loadAvailableItems();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (r) => {
    setEditRecord(r);
    setEditForm({
      quantityout: r.quantityout,
      stockoutDate: r.stockoutDate,
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
      await updateStockOut(editRecord.stockoutId, editForm);
      closeEdit();
      loadRecords();
      loadAvailableItems();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stock out record?')) return;
    try {
      await deleteStockOut(id);
      loadRecords();
      loadAvailableItems();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="page">
      <h2>Issue Stock Out</h2>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Item to Issue *</label>
            <select name="stockInId" value={form.stockInId} onChange={handleChange} required>
              <option value="">-- Select Item --</option>
              {availableItems.map((item) => (
                <option key={item.stockinId} value={item.stockinId}>
                  {item.itemname} ({item.description}) - Available: {item.availableQty}
                </option>
              ))}
            </select>
          </div>
          {selectedItem && (
            <div className="info-box">
              Available quantity: <strong>{selectedItem.availableQty}</strong>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Quantity to Issue *</label>
              <input
                type="number"
                name="quantityout"
                value={form.quantityout}
                onChange={handleChange}
                min="1"
                max={selectedItem?.availableQty || 1}
                required
              />
            </div>
            <div className="form-group">
              <label>Issue Date *</label>
              <input
                type="date"
                name="stockoutDate"
                value={form.stockoutDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Issuing...' : 'Issue Stock'}
          </button>
        </form>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Stock Out History</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty Out</th>
              <th>Remaining</th>
              <th>Date</th>
              <th>Issued By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-msg">No stock out records</td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.stockoutId}>
                  <td>{r.itemname}</td>
                  <td>{r.quantityout}</td>
                  <td>{r.totalquantityout}</td>
                  <td>{r.stockoutDate}</td>
                  <td>{r.userName}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(r.stockoutId)}>Delete</button>
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
            <h3>Edit Stock Out Record</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Item</label>
                <input type="text" value={editRecord.itemname} disabled />
              </div>
              <div className="form-group">
                <label>Quantity Issued</label>
                <input type="number" name="quantityout" value={editForm.quantityout} onChange={handleEditChange} min="1" required />
              </div>
              <div className="form-group">
                <label>Issue Date</label>
                <input type="date" name="stockoutDate" value={editForm.stockoutDate} onChange={handleEditChange} required />
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
