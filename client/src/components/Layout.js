import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLanguage } from '../context/LanguageContext';

export default function Layout() {
  const { t } = useLanguage();

  return (
    <div className="d-flex flex-column min-vh-100">
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>
      <Navbar />
      <main id="main-content" className="flex-grow-1 py-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
