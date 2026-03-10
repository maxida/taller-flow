import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, Car, Wrench, Calendar, ChevronDown, Filter, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLORES_MARCAS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#cbd5e1'];
const MESES_NOMBRES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Dashboard() {
  const [ots, setOts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filtroTiempo, setFiltroTiempo] = useState('Últimos 6 Meses');
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  useEffect(() => {
    const fetchOTs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ordenes"));
        const historialOTs = querySnapshot.docs.map(doc => doc.data());
        setOts(historialOTs);
      } catch (error) {
        console.error("Error al cargar datos del dashboard: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOTs();
  }, []);

  const dashboardData = useMemo(() => {
    if (ots.length === 0) return null;

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    let otsFiltradas = ots;
    if (filtroEstado !== 'Todas') {
      otsFiltradas = otsFiltradas.filter(ot => ot.estado === filtroEstado);
    }

    // 1. LÓGICA DEL NUEVO FILTRO DE 12 MESES
    let fechaLimite = new Date();
    if (filtroTiempo === 'Este Mes') {
      fechaLimite = new Date(anioActual, mesActual, 1);
    } else if (filtroTiempo === 'Últimos 3 Meses') {
      fechaLimite.setMonth(ahora.getMonth() - 3);
    } else if (filtroTiempo === 'Últimos 6 Meses') {
      fechaLimite.setMonth(ahora.getMonth() - 6);
    } else if (filtroTiempo === 'Últimos 12 Meses') { // <-- ACÁ
      fechaLimite.setMonth(ahora.getMonth() - 12);
    } else if (filtroTiempo === 'Este Año (2026)') {
      fechaLimite = new Date(anioActual, 0, 1);
    }

    otsFiltradas = otsFiltradas.filter(ot => {
      if (!ot.fecha) return false;
      const fechaOT = new Date(ot.fecha + 'T00:00:00');
      return fechaOT >= fechaLimite;
    });

    const ingresosPeriodo = otsFiltradas.length;

    const ingresosEsteMes = ots.filter(ot => {
      if (!ot.fecha) return false;
      const f = new Date(ot.fecha + 'T00:00:00');
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    }).length;

    const ingresosMesPasado = ots.filter(ot => {
      if (!ot.fecha) return false;
      const f = new Date(ot.fecha + 'T00:00:00');
      let mesPasado = mesActual - 1;
      let anioPasado = anioActual;
      if (mesPasado < 0) { mesPasado = 11; anioPasado--; }
      return f.getMonth() === mesPasado && f.getFullYear() === anioPasado;
    }).length;

    let porcentajeCrecimiento = 0;
    if (ingresosMesPasado === 0) {
      porcentajeCrecimiento = ingresosEsteMes > 0 ? 100 : 0;
    } else {
      porcentajeCrecimiento = Math.round(((ingresosEsteMes - ingresosMesPasado) / ingresosMesPasado) * 100);
    }

    const otAbiertas = ots.filter(ot => ot.estado === 'Abierta').length;

    const marcasCount = {};
    const modelosCount = {};
    const serviciosCount = {};
    const mesesCount = {};

    otsFiltradas.forEach(ot => {
      if (ot.marca) marcasCount[ot.marca] = (marcasCount[ot.marca] || 0) + 1;
      if (ot.modelo) modelosCount[ot.modelo] = (modelosCount[ot.modelo] || 0) + 1;
      
      if (ot.servicios && Array.isArray(ot.servicios)) {
        ot.servicios.forEach(srv => {
          serviciosCount[srv] = (serviciosCount[srv] || 0) + 1;
        });
      }

      if (ot.fecha) {
        const f = new Date(ot.fecha + 'T00:00:00');
        const claveMes = `${f.getFullYear()}-${String(f.getMonth()).padStart(2, '0')}`;
        mesesCount[claveMes] = (mesesCount[claveMes] || 0) + 1;
      }
    });

    const marcaTop = Object.keys(marcasCount).length > 0 ? Object.keys(marcasCount).reduce((a, b) => marcasCount[a] > marcasCount[b] ? a : b) : 'N/A';
    const modeloTop = Object.keys(modelosCount).length > 0 ? Object.keys(modelosCount).reduce((a, b) => modelosCount[a] > modelosCount[b] ? a : b) : 'N/A';

    const marcasArray = Object.entries(marcasCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    let graficoMarcas = [];
    if (marcasArray.length <= 5) {
      graficoMarcas = marcasArray;
    } else {
      graficoMarcas = marcasArray.slice(0, 4);
      const otrasValue = marcasArray.slice(4).reduce((sum, item) => sum + item.value, 0);
      graficoMarcas.push({ name: 'Otras', value: otrasValue });
    }

    const topServicios = Object.entries(serviciosCount)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // 2. CONFIGURACIÓN DEL GRÁFICO PARA 12 MESES
    let mesesA_Mostrar = 6;
    if (filtroTiempo === 'Este Mes') mesesA_Mostrar = 1;
    if (filtroTiempo === 'Últimos 3 Meses') mesesA_Mostrar = 3;
    if (filtroTiempo === 'Últimos 6 Meses') mesesA_Mostrar = 6;
    if (filtroTiempo === 'Últimos 12 Meses') mesesA_Mostrar = 12; // <-- ACÁ
    if (filtroTiempo === 'Este Año (2026)') mesesA_Mostrar = mesActual + 1;

    const graficoMeses = [];
    for (let i = mesesA_Mostrar - 1; i >= 0; i--) {
      let d = new Date(anioActual, mesActual - i, 1);
      const claveMes = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      graficoMeses.push({
        mes: MESES_NOMBRES[d.getMonth()],
        autos: mesesCount[claveMes] || 0
      });
    }

    return {
      ingresosPeriodo, porcentajeCrecimiento, otAbiertas, marcaTop, modeloTop,
      graficoMarcas, topServicios, graficoMeses
    };

  }, [ots, filtroTiempo, filtroEstado]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-blue-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-700">Calculando métricas...</h2>
      </div>
    );
  }

  if (!dashboardData && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto pb-10 text-center py-20">
        <LayoutDashboard size={64} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">El Dashboard está vacío</h2>
        <p className="text-slate-500 mt-2">Generá algunas Órdenes de Trabajo para ver las estadísticas de tu taller.</p>
      </div>
    );
  }

  const { ingresosPeriodo, porcentajeCrecimiento, otAbiertas, marcaTop, modeloTop, graficoMarcas, topServicios, graficoMeses } = dashboardData;
  const maxServicioCantidad = topServicios.length > 0 ? topServicios[0].cantidad : 1;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <LayoutDashboard className="text-blue-600" size={32} />
            Dashboard y KPIs
          </h2>
          <p className="mt-2 text-slate-500">Métricas en tiempo real procesadas desde tu base de datos.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative inline-block">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" size={16} />
            <select 
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 pl-9 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option value="Todas">Todas las OT</option>
              <option value="Abierta">OT Abiertas</option>
              <option value="Cerrada">OT Cerradas</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>

          <div className="relative inline-block">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" size={16} />
            <select 
              value={filtroTiempo}
              onChange={(e) => setFiltroTiempo(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 pl-9 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option>Este Mes</option>
              <option>Últimos 3 Meses</option>
              <option>Últimos 6 Meses</option>
              {/* 3. OPCIÓN AGREGADA AL SELECTOR VISUAL */}
              <option>Últimos 12 Meses</option>
              <option>Este Año (2026)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Ingresos ({filtroTiempo})</p>
              <h3 className="text-3xl font-black text-slate-800">{ingresosPeriodo}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Car size={24} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {porcentajeCrecimiento >= 0 ? (
              <><TrendingUp size={16} className="text-emerald-500 mr-1" /><span className="text-emerald-600 font-bold">+{porcentajeCrecimiento}%</span></>
            ) : (
              <><TrendingDown size={16} className="text-red-500 mr-1" /><span className="text-red-600 font-bold">{porcentajeCrecimiento}%</span></>
            )}
            <span className="text-slate-500 ml-2">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">En el Taller Ahora</p>
              <h3 className="text-3xl font-black text-slate-800">{otAbiertas}</h3>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-amber-500"><Wrench size={24} /></div>
          </div>
          <div className="mt-4 text-sm text-slate-500">Órdenes Abiertas sin cerrar</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Marca Frecuente</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 truncate max-w-[120px]">{marcaTop}</h3>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600"><TrendingUp size={24} /></div>
          </div>
          <div className="mt-4 text-sm text-slate-500">Según filtros aplicados</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Modelo Top</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 truncate max-w-[120px]">{modeloTop}</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600"><Calendar size={24} /></div>
          </div>
          <div className="mt-4 text-sm text-slate-500">Según filtros aplicados</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Ingresos de Vehículos</h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficoMeses} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="autos" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Distribución por Marcas</h3>
          <div className="flex-1 min-h-[300px] w-full relative">
            {graficoMarcas.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Sin datos suficientes</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={graficoMarcas} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {graficoMarcas.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_MARCAS[index % COLORES_MARCAS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Wrench className="text-slate-400" size={20} /> Servicios Más Solicitados
        </h3>
        <div className="overflow-x-auto">
          {topServicios.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No hay servicios registrados en este periodo.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Servicio Realizado</th>
                  <th className="pb-3 font-semibold text-right">Cantidad Total</th>
                  <th className="pb-3 font-semibold text-right">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {topServicios.map((servicio, index) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 text-slate-800 font-medium">{servicio.nombre}</td>
                    <td className="py-4 text-right font-bold text-slate-600">{servicio.cantidad}</td>
                    <td className="py-4 text-right">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 max-w-[100px] ml-auto">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(servicio.cantidad / maxServicioCantidad) * 100}%` }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}