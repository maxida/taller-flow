import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { currentUser } = useAuth();

  // Si no hay usuario logueado, lo mandamos al login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si está logueado, lo dejamos pasar a la ruta que pidió
  return <Outlet />;
}