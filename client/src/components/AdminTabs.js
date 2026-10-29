import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const tabs = [
  { to: '/admin', key: 'nav.adminDashboard', end: true },
  { to: '/admin/users', key: 'nav.adminUsers' },
  { to: '/admin/resources', key: 'nav.adminResources' },
  { to: '/admin/orders', key: 'nav.adminOrders' },
  { to: '/admin/pests', key: 'nav.adminPests' },
  { to: '/admin/moderation', key: 'nav.adminModeration' }
];

export default function AdminTabs() {
  const { t } = useLanguage();

  return (
    <ul className="nav nav-pills admin-tabs gap-2 mb-4 agri-table-wrap">
      {tabs.map((tab) => (
        <li className="nav-item" key={tab.to}>
          <NavLink
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {t(tab.key)}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
