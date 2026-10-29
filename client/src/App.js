import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Farms = lazy(() => import('./pages/Farms'));
const Crops = lazy(() => import('./pages/Crops'));
const Soil = lazy(() => import('./pages/Soil'));
const Weather = lazy(() => import('./pages/Weather'));
const Pests = lazy(() => import('./pages/Pests'));
const Resources = lazy(() => import('./pages/Resources'));
const Orders = lazy(() => import('./pages/Orders'));
const Consultations = lazy(() => import('./pages/Consultations'));
const Forum = lazy(() => import('./pages/Forum'));
const ForumPost = lazy(() => import('./pages/ForumPost'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminResources = lazy(() => import('./pages/admin/AdminResources'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminPests = lazy(() => import('./pages/admin/AdminPests'));
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration'));

/**
 * Route map. Every private page is lazy-loaded (code splitting) and guarded by
 * ProtectedRoute. Admin pages add a second role check.
 */
export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farms" element={<Farms />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/soil" element={<Soil />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/pests" element={<Pests />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:id" element={<ForumPost />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/admin" element={<ProtectedRoute role="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="resources" element={<AdminResources />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="pests" element={<AdminPests />} />
              <Route path="moderation" element={<AdminModeration />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
