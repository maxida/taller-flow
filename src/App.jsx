import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

import Layout from './components/Layout';
import CheckIn from './pages/CheckIn';
import GestionOT from './pages/GestionOT';
import Historial from './pages/Historial';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Presupuesto from './pages/Presupuesto';
import Perfil from './pages/Perfil'; // <-- 1. NUEVO IMPORT

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/ingreso" replace />} /> 
              <Route path="ingreso" element={<CheckIn />} />
              <Route path="gestion" element={<GestionOT />} />
              <Route path="historial" element={<Historial />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="presupuesto" element={<Presupuesto />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="perfil" element={<Perfil />} /> {/* <-- 2. NUEVA RUTA */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;