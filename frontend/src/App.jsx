import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import StockIn from './components/StockIn'
import StockOut from './components/StockOut'
import Reports from './components/Reports'
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={() => setUser(null)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stockin" element={<StockIn />} />
          <Route path="/stockout" element={<StockOut />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
