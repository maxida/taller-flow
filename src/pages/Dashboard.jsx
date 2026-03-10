import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Car, Wrench, Calendar, ChevronDown } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// --- DATOS MOCK PARA EL DASHBOARD ---
const KPI_DATA = {
  ingresosMes: 42,
  crecimiento: '+15%',
  otAbiertas: 12,
  marcaTop: 'Volkswagen',
  modeloTop: 'Gol Trend'
};

const GRAFICO_MESES = [
  { mes: 'Oct', autos: 28 },
  { mes: 'Nov', autos: 35 },
  { mes: 'Dic', autos: 30 },
  { mes: 'Ene', autos: 25 },
  { mes: 'Feb', autos: 38 },
  { mes: 'Mar', autos: 42 },
];

const GRAFICO_MARCAS = [
  { name: 'Volkswagen', value: 45 },
  { name: 'Ford', value: 30 },
  { name: 'Toyota', value: 25 },
  { name: 'Chevrolet', value: 20 },
  { name: 'Otras', value: 15 },
];

const COLORES_MARCAS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#cbd5e1'];

const TOP_SERVICIOS = [
  { nombre: 'Cambio de Aceite y Filtros', cantidad: 85 },
  { nombre: 'Alineación y Balanceo', cantidad: 62 },
  { nombre: 'Cambio de Pastillas', cantidad: 48 },
  { nombre: 'Escaneo Computarizado', cantidad: 35 },
];

export default function Dashboard() {
  const [filtroTiempo, setFiltroTiempo] = useState('Ultimos 6 Meses');

  return (
    <div className="max-w-7xl mx-auto pb-10">
      
      {/* HEADER Y FILTRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <LayoutDashboard className="text-blue-600" size={32} />
            Dashboard y KPIs
          </h2>
          <p className="mt-2 text-slate-500">Métricas en tiempo real sobre el rendimiento del taller.</p>
        </div>
        
        <div className="relative inline-block">
          <select 
            value={filtroTiempo}
            onChange={(e) => setFiltroTiempo(e.target.value)}
            className="appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
          >
            <option>Este Mes</option>
            <option>Últimos 3 Meses</option>
            <option>Últimos 6 Meses</option>
            <option>Este Año (2026)</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
        </div>
      </div>

      {/* FILA 1: TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI 1 */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Ingresos del Mes</p>
              <h3 className="text-3xl font-black text-slate-800">{KPI_DATA.ingresosMes}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <Car size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={16} className="text-emerald-500 mr-1" />
            <span className="text-emerald-600 font-bold">{KPI_DATA.crecimiento}</span>
            <span className="text-slate-500 ml-2">vs mes anterior</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">OT Abiertas</p>
              <h3 className="text-3xl font-black text-slate-800">{KPI_DATA.otAbiertas}</h3>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-amber-500">
              <Wrench size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Vehículos actualmente en el taller
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Marca Frecuente</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{KPI_DATA.marcaTop}</h3>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Representa el 33% del total
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Modelo Top</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{KPI_DATA.modeloTop}</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
              <Calendar size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Basado en el histórico general
          </div>
        </div>

      </div>

      {/* FILA 2: GRÁFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Gráfico de Barras (Ocupa 2 columnas) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Ingresos de Vehículos ({filtroTiempo})</h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GRAFICO_MESES} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="autos" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Torta (Ocupa 1 columna) */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Distribución por Marcas</h3>
          <div className="flex-1 min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={GRAFICO_MARCAS}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {GRAFICO_MARCAS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_MARCAS[index % COLORES_MARCAS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* FILA 3: TABLA DE RANKING */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Wrench className="text-slate-400" size={20} />
          Servicios Más Solicitados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Servicio Realizado</th>
                <th className="pb-3 font-semibold text-right">Cantidad Total</th>
                <th className="pb-3 font-semibold text-right">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {TOP_SERVICIOS.map((servicio, index) => (
                <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 text-slate-800 font-medium">{servicio.nombre}</td>
                  <td className="py-4 text-right font-bold text-slate-600">{servicio.cantidad}</td>
                  <td className="py-4 text-right">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 max-w-[100px] ml-auto">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${(servicio.cantidad / TOP_SERVICIOS[0].cantidad) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}