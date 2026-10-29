import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const farmerLinks = [
  { to: '/dashboard', key: 'nav.dashboard', icon: '🏠' },
  { to: '/farms', key: 'nav.farms', icon: '🌾' },
  { to: '/crops', key: 'nav.crops', icon: '🌱' },
  { to: '/soil', key: 'nav.soil', icon: '🧪' },
  { to: '/weather', key: 'nav.weather', icon: '⛅' },
  { to: '/pests', key: 'nav.pests', icon: '🐛' },
  { to: '/resources', key: 'nav.resources', icon: '🛒' },
  { to: '/orders', key: 'nav.orders', icon: '📦' },
  { to: '/consultations', key: 'nav.consultations', icon: '👩‍🌾' },
  { to: '/forum', key: 'nav.forum', icon: '💬' },
  { to: '/profile', key: 'nav.profile', icon: '👤' }
];

const adminLinks = [
  { to: '/admin', key: 'nav.adminDashboard', icon: '📊' },
  { to: '/admin/users', key: 'nav.adminUsers', icon: '👥' },
  { to: '/admin/resources', key: 'nav.adminResources', icon: '🛒' },
  { to: '/admin/orders', key: 'nav.adminOrders', icon: '📦' },
  { to: '/admin/pests', key: 'nav.adminPests', icon: '🐛' },
  { to: '/admin/moderation', key: 'nav.adminModeration', icon: '🛡️' },
  { to: '/weather', key: 'nav.weather', icon: '⛅' },
  { to: '/forum', key: 'nav.forum', icon: '💬' },
  { to: '/profile', key: 'nav.profile', icon: '👤' }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, languages } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const links = user.role === 'admin' ? adminLinks : farmerLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg agri-navbar sticky-top shadow-sm" aria-label="Main navigation">
      <div className="container">
        <Link
          className="navbar-brand d-flex align-items-center gap-2"
          to={user.role === 'admin' ? '/admin' : '/dashboard'}
        >
          <span aria-hidden="true">🌱</span> {t('appName')}
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="agri-main-nav"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`} id="agri-main-nav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/admin'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span aria-hidden="true" className="me-1">
                    {link.icon}
                  </span>
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center gap-2 flex-wrap pb-2 pb-lg-0">
            <label className="visually-hidden" htmlFor="navbar-language">
              {t('common.language')}
            </label>
            <select
              id="navbar-language"
              className="form-select form-select-sm w-auto"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            <span className="text-white small d-none d-xl-inline">
              {user.name} · {user.role}
            </span>

            <button type="button" className="btn btn-sm btn-light" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
