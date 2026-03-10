import { Outlet, Link, useLocation } from 'react-router-dom';
import { ClipboardList, Wrench, History, LayoutDashboard, Package  } from 'lucide-react';
import logoImg from '../assets/logo.png';


export default function Layout() {
  const location = useLocation();

  const menuItems = [
    { name: 'Ingreso Vehículo', path: '/', icon: <ClipboardList size={20} /> },
    { name: 'Gestión de OT', path: '/gestion', icon: <Wrench size={20} /> },
    { name: 'Historial', path: '/historial', icon: <History size={20} /> },
    { name: 'Inventario', path: '/inventario', icon: <Package size={20} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar / Menú Lateral */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        {/* Espacio para el LOGO */}
        <div className="h-24 flex items-center justify-center border-b border-slate-800 bg-slate-950/50 p-4">
          <img 
            src={logoImg} 
            alt="Logo TallerFlow" 
            className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        {/* Footer sutil */}
        <div className="px-4 py-4">
          <div className="text-center">
            <span className="text-white/70 italic text-xs font-medium">Developed by <span className="font-semibold">Ing. Quinteros</span> v1.0</span>
          </div>
        </div>
      </aside>

      {/* Contenido Principal (Acá se renderiza la página activa) */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}