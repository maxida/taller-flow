import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CheckIn from './pages/CheckIn';
import GestionOT from './pages/GestionOT';
import Historial from './pages/Historial';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario'; // <-- 1. Importá esto

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* El Layout envuelve a todas las páginas para que el menú siempre esté visible */}
        <Route path="/" element={<Layout />}>
          <Route index element={<CheckIn />} /> {/* Ruta por defecto */}
          <Route path="gestion" element={<GestionOT />} />
          <Route path="historial" element={<Historial />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventario" element={<Inventario />} /> {/* <-- 2. Agregá esta línea */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;