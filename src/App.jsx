import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CheckIn from './pages/CheckIn';
import GestionOT from './pages/GestionOT';
import Historial from './pages/Historial';
import Dashboard from './pages/Dashboard';

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;