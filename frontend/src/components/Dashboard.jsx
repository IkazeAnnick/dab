import { useState, useEffect } from 'react';
import { getCurrentStock } from '../api';

export default function Dashboard() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    try {
      setLoading(true);
      const data = await getCurrentStock();
      setStock(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading stock data...</div>;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Current Stock Dashboard</h2>
        <button onClick={loadStock} className="btn-secondary">Refresh</button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Description</th>
              <th>Total Received</th>
              <th>Total Issued</th>
              <th>Current Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stock.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-msg">No stock records found</td>
              </tr>
            ) : (
              stock.map((item, i) => (
                <tr key={i}>
                  <td>{item.itemname}</td>
                  <td>{item.description}</td>
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
    </div>
  );
}
