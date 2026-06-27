import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ClipboardList, Wrench, History, LayoutDashboard, Package, Calculator, LogOut, User, Menu, X } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const location = useLocation();
  const { logout } = useAuth();
  
  // NUEVO ESTADO: Controla si el menú móvil está abierto o cerrado
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Ingreso Vehículo', path: '/ingreso', icon: <ClipboardList size={20} /> },
    { name: 'Gestión de OT', path: '/gestion', icon: <Wrench size={20} /> },
    { name: 'Historial', path: '/historial', icon: <History size={20} /> },
    { name: 'Inventario', path: '/inventario', icon: <Package size={20} /> },
    { name: 'Presupuesto', path: '/presupuesto', icon: <Calculator size={20} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Perfil', path: '/perfil', icon: <User size={20} /> },
  ];

  // Función para cerrar el menú en móviles luego de hacer clic en un link
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    // min-h-[100dvh] asegura que ocupe el alto real en móviles (ignora la barra de direcciones de Safari/Chrome)
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden relative">
      
      {/* ── OVERLAY (Fondo oscuro) PARA MÓVILES ── */}
      {/* Aparece cuando el menú está abierto y permite cerrarlo tocando afuera */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* ── SIDEBAR / MENÚ LATERAL ── */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-slate-900 text-white flex flex-col shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Espacio para el LOGO y botón de cerrar (solo móvil) */}
        <div className="h-16 lg:h-24 flex items-center justify-between lg:justify-center border-b border-slate-800 bg-slate-950/50 px-6 lg:p-4 shrink-0">
          <img 
            src={logoImg} 
            alt="Logo TallerFlow" 
            className="h-10 lg:max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-300 hover:scale-105"
          />
          {/* Botón X para cerrar en móvil */}
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md bg-slate-800"
            onClick={closeMobileMenu}
          >
            <X size={20} />
          </button>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={closeMobileMenu} // Cierra el menú al navegar
                className={`flex items-center gap-3 px-4 py-3.5 lg:py-3 rounded-lg transition-all font-medium ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Footer y Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900">
          <button 
            onClick={() => {
              closeMobileMenu();
              logout();
            }} 
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white py-3 lg:py-2.5 rounded-lg transition-colors font-bold lg:font-medium text-sm mb-4 shadow-sm"
          >
            <LogOut size={18} className="lg:w-4 lg:h-4" /> Cerrar Sesión
          </button>
          <div className="text-center">
            <span className="text-white/40 italic text-[10px] tracking-wide">Developed by <span className="font-semibold">Ing. Quinteros</span> v2.1</span>
          </div>
        </div>
      </aside>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER MÓVIL (Solo visible en pantallas chicas) */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-black text-slate-800 text-lg tracking-tight">JOTA M.</h1>
          </div>
          <img src={logoImg} alt="Logo" className="h-8 w-8 object-contain rounded bg-slate-900 p-1" />
        </header>

        {/* CONTENIDO (Acá se renderiza la página activa) */}
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[100vw]">
            <Outlet />
          </div>
        </main>
      </div>
      
    </div>
  );
}