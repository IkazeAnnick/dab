import { useState, useEffect } from 'react';
import { getStockInRecords, getStockOutRecords, getCurrentStock, updateStockIn, deleteStockIn, updateStockOut, deleteStockOut } from '../api';

const ITEMS = ['Steel bars', 'Wheelbarrows', 'Ceramic tiles'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('stock');
  const [stock, setStock] = useState([]);
  const [stockInRecords, setStockInRecords] = useState([]);
  const [stockOutRecords, setStockOutRecords] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editType, setEditType] = useState('');

  useEffect(() => {
    loadCurrentStock();
  }, []);

  const loadCurrentStock = async () => {
    try {
      const data = await getCurrentStock();
      setStock(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFilteredReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [inData, outData, stockData] = await Promise.all([
        getStockInRecords(params),
        getStockOutRecords(params),
        getCurrentStock(),
      ]);
      setStockInRecords(inData);
      setStockOutRecords(outData);
      setStock(stockData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const totalStockIn = stockInRecords.reduce((sum, r) => sum + Number(r.quantityin), 0);
  const totalStockOut = stockOutRecords.reduce((sum, r) => sum + Number(r.quantityout), 0);

  const openEdit = (type, r) => {
    setEditType(type);
    setEditRecord(r);
    if (type === 'stockin') {
      setEditForm({
        itemname: r.itemname,
        description: r.description,
        quantityin: r.quantityin,
        suppliername: r.suppliername,
        stockindate: r.stockindate,
      });
    } else {
      setEditForm({
        quantityout: r.quantityout,
        stockoutDate: r.stockoutDate,
      });
    }
  };

  const closeEdit = () => {
    setEditRecord(null);
    setEditForm({});
    setEditType('');
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editType === 'stockin') {
        await updateStockIn(editRecord.stockinId, editForm);
      } else {
        await updateStockOut(editRecord.stockoutId, editForm);
      }
      closeEdit();
      loadFilteredReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      if (type === 'stockin') {
        await deleteStockIn(id);
      } else {
        await deleteStockOut(id);
      }
      loadFilteredReports();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <h2>Reports</h2>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Items</h3>
          <p className="summary-value">{stock.length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Stock In</h3>
          <p className="summary-value">{totalStockIn}</p>
        </div>
        <div className="summary-card">
          <h3>Total Stock Out</h3>
          <p className="summary-value">{totalStockOut}</p>
        </div>
      </div>

      <div className="filter-section">
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </div>
          <div className="form-group" style={{ alignSelf: 'flex-end' }}>
            <button onClick={loadFilteredReports} disabled={loading} className="btn-secondary">
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          Current Stock
        </button>
        <button
          className={`tab ${activeTab === 'stockin' ? 'active' : ''}`}
          onClick={() => setActiveTab('stockin')}
        >
          Stock In Records
        </button>
        <button
          className={`tab ${activeTab === 'stockout' ? 'active' : ''}`}
          onClick={() => setActiveTab('stockout')}
        >
          Stock Out Records
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'stock' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Total Received</th>
                  <th>Total Issued</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.length === 0 ? (
                  <tr><td colSpan="5" className="empty-msg">No stock data</td></tr>
                ) : (
                  stock.map((item, i) => (
                    <tr key={i}>
                      <td>{item.itemname}</td>
                      <td>{item.totalquantityin}</td>
                      <td>{item.totalIssued}</td>
                      <td className={item.currentStock <= 0 ? 'text-danger' : 'text-success'}>
                        {item.currentStock}
                      </td>
                      <td>
                        <span className={`badge ${item.currentStock <= 0 ? 'badge-danger' : 'badge-success'}`}>
                          {item.currentStock <= 0 ? 'Out of Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'stockin' && (
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
                {stockInRecords.length === 0 ? (
                  <tr><td colSpan="8" className="empty-msg">No records found</td></tr>
                ) : (
                  stockInRecords.map((r) => (
                    <tr key={r.stockinId}>
                      <td>{r.itemname}</td>
                      <td>{r.description}</td>
                      <td>{r.quantityin}</td>
                      <td>{r.totalquantityin}</td>
                      <td>{r.suppliername}</td>
                      <td>{r.stockindate}</td>
                      <td>{r.userName}</td>
                      <td>
                        <button className="btn-edit" onClick={() => openEdit('stockin', r)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('stockin', r.stockinId)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'stockout' && (
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
                {stockOutRecords.length === 0 ? (
                  <tr><td colSpan="6" className="empty-msg">No records found</td></tr>
                ) : (
                  stockOutRecords.map((r) => (
                    <tr key={r.stockoutId}>
                      <td>{r.itemname}</td>
                      <td>{r.quantityout}</td>
                      <td>{r.totalquantityout}</td>
                      <td>{r.stockoutDate}</td>
                      <td>{r.userName}</td>
                      <td>
                        <button className="btn-edit" onClick={() => openEdit('stockout', r)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('stockout', r.stockoutId)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editRecord && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editType === 'stockin' ? 'Edit Stock In Record' : 'Edit Stock Out Record'}</h3>
            <form onSubmit={handleEditSubmit}>
              {editType === 'stockin' ? (
                <>
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
                </>
              ) : (
                <>
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
                </>
              )}
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
