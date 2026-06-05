import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        DAB Enterprise LTD
      </div>
      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/stockin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Stock In
        </NavLink>
        <NavLink to="/stockout" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Stock Out
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Reports
        </NavLink>
      </div>
      <div className="navbar-user">
        <span>{user?.userName}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}
