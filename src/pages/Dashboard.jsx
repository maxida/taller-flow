import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, Car, Wrench, Calendar, ChevronDown, Filter, Loader2, Package, DollarSign, Wallet, CreditCard, Activity } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, 
  FunnelChart, Funnel, LabelList,
  AreaChart, Area,
  ComposedChart, Line
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLORES_MARCAS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#cbd5e1'];
const COLORES_EMBUDO = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];
const COLORES_FINANZAS = ['#10b981', '#3b82f6']; 
const MESES_NOMBRES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Dashboard() {
  const [ots, setOts] = useState([]);
  const [inventario, setInventario] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('operaciones');

  const [filtroTiempo, setFiltroTiempo] = useState('Últimos 6 Meses');
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  const formatearMiles = (num) => Number(num).toLocaleString('es-AR');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const otsSnapshot = await getDocs(collection(db, "ordenes"));
        const historialOTs = otsSnapshot.docs.map(doc => doc.data());
        setOts(historialOTs);

        const invSnapshot = await getDocs(collection(db, "inventario"));
        const itemsInventario = invSnapshot.docs.map(doc => doc.data());
        setInventario(itemsInventario);
      } catch (error) {
        console.error("Error al cargar datos del dashboard: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const dashboardData = useMemo(() => {
    if (ots.length === 0 && inventario.length === 0) return null;

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    let otsFiltradas = ots;
    if (filtroEstado !== 'Todas') {
      otsFiltradas = otsFiltradas.filter(ot => ot.estado === filtroEstado);
    }

    let fechaLimite = new Date();
    let mesesA_Mostrar = 6;
    if (filtroTiempo === 'Este Mes') {
      fechaLimite = new Date(anioActual, mesActual, 1);
      mesesA_Mostrar = 1;
    } else if (filtroTiempo === 'Últimos 3 Meses') {
      fechaLimite.setMonth(ahora.getMonth() - 3);
      mesesA_Mostrar = 3;
    } else if (filtroTiempo === 'Últimos 6 Meses') {
      fechaLimite.setMonth(ahora.getMonth() - 6);
      mesesA_Mostrar = 6;
    } else if (filtroTiempo === 'Últimos 12 Meses') {
      fechaLimite.setMonth(ahora.getMonth() - 12);
      mesesA_Mostrar = 12;
    } else if (filtroTiempo === 'Este Año (2026)') {
      fechaLimite = new Date(anioActual, 0, 1);
      mesesA_Mostrar = mesActual + 1;
    }

    otsFiltradas = otsFiltradas.filter(ot => {
      if (!ot.fecha) return false;
      const fechaOT = new Date(ot.fecha + 'T00:00:00');
      return fechaOT >= fechaLimite;
    });

    const ingresosPeriodo = otsFiltradas.length;
    const otAbiertas = ots.filter(ot => ot.estado === 'Abierta').length;

    const ingresosEsteMes = ots.filter(ot => {
      if (!ot.fecha) return false;
      const f = new Date(ot.fecha + 'T00:00:00');
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    }).length;
    const ingresosMesPasado = ots.filter(ot => {
      if (!ot.fecha) return false;
      const f = new Date(ot.fecha + 'T00:00:00');
      let mesPasado = mesActual - 1; let anioPasado = anioActual;
      if (mesPasado < 0) { mesPasado = 11; anioPasado--; }
      return f.getMonth() === mesPasado && f.getFullYear() === anioPasado;
    }).length;
    const porcentajeCrecimiento = ingresosMesPasado === 0 ? (ingresosEsteMes > 0 ? 100 : 0) : Math.round(((ingresosEsteMes - ingresosMesPasado) / ingresosMesPasado) * 100);

    const otsCerradasFiltradas = otsFiltradas.filter(ot => ot.estado === 'Cerrada');
    
    const facturacionTotal = otsCerradasFiltradas.reduce((sum, ot) => sum + (ot.totalFinal || 0), 0);
    const totalManoObra = otsCerradasFiltradas.reduce((sum, ot) => sum + (ot.costoManoObra || 0), 0);
    const totalRepuestos = otsCerradasFiltradas.reduce((sum, ot) => sum + (ot.costoRepuestos || 0), 0);
    const ticketPromedio = otsCerradasFiltradas.length > 0 ? Math.round(facturacionTotal / otsCerradasFiltradas.length) : 0;

    const factEsteMes = ots.filter(ot => {
      if (!ot.fecha || ot.estado !== 'Cerrada') return false;
      const f = new Date(ot.fecha + 'T00:00:00');
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    }).reduce((sum, ot) => sum + (ot.totalFinal || 0), 0);
    
    const factMesPasado = ots.filter(ot => {
      if (!ot.fecha || ot.estado !== 'Cerrada') return false;
      const f = new Date(ot.fecha + 'T00:00:00');
      let mPasado = mesActual - 1; let aPasado = anioActual;
      if (mPasado < 0) { mPasado = 11; aPasado--; }
      return f.getMonth() === mPasado && f.getFullYear() === aPasado;
    }).reduce((sum, ot) => sum + (ot.totalFinal || 0), 0);
    
    const porcentajeCrecimientoFinanciero = factMesPasado === 0 ? (factEsteMes > 0 ? 100 : 0) : Math.round(((factEsteMes - factMesPasado) / factMesPasado) * 100);

    const marcasCount = {};
    const modelosCount = {};
    const serviciosCount = {};
    const repuestosCount = {};

    otsFiltradas.forEach(ot => {
      if (ot.marca) marcasCount[ot.marca] = (marcasCount[ot.marca] || 0) + 1;
      if (ot.modelo) modelosCount[ot.modelo] = (modelosCount[ot.modelo] || 0) + 1;
      if (ot.servicios) ot.servicios.forEach(srv => { serviciosCount[srv] = (serviciosCount[srv] || 0) + 1; });
      if (ot.repuestosUtilizados) ot.repuestosUtilizados.forEach(rep => { repuestosCount[rep.nombre] = (repuestosCount[rep.nombre] || 0) + (rep.cantidad || 1); });
    });

    const marcaTop = Object.keys(marcasCount).length > 0 ? Object.keys(marcasCount).reduce((a, b) => marcasCount[a] > marcasCount[b] ? a : b) : 'N/A';
    const modeloTop = Object.keys(modelosCount).length > 0 ? Object.keys(modelosCount).reduce((a, b) => modelosCount[a] > modelosCount[b] ? a : b) : 'N/A';
    const repuestoTopStr = Object.keys(repuestosCount).length > 0 ? Object.keys(repuestosCount).reduce((a, b) => repuestosCount[a] > repuestosCount[b] ? a : b) : 'N/A';

    const marcasArray = Object.entries(marcasCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    let graficoMarcas = marcasArray.length <= 5 ? marcasArray : [...marcasArray.slice(0, 4), { name: 'Otras', value: marcasArray.slice(4).reduce((s, i) => s + i.value, 0) }];
    
    const topServicios = Object.entries(serviciosCount).map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    const graficoMeses = [];
    for (let i = mesesA_Mostrar - 1; i >= 0; i--) {
      let d = new Date(anioActual, mesActual - i, 1);
      const m = d.getMonth(); const a = d.getFullYear();
      
      const otsDelMes = ots.filter(ot => {
        if (!ot.fecha) return false;
        const f = new Date(ot.fecha + 'T00:00:00');
        return f.getMonth() === m && f.getFullYear() === a;
      });

      const facturacionDelMes = otsDelMes.filter(ot => ot.estado === 'Cerrada').reduce((sum, ot) => sum + (ot.totalFinal || 0), 0);

      graficoMeses.push({
        mes: MESES_NOMBRES[m],
        autos: otsDelMes.length,
        facturacion: facturacionDelMes
      });
    }

    const topStockInventario = [...inventario].filter(i => i.stock > 0).sort((a, b) => b.stock - a.stock).slice(0, 10).map((i, idx) => ({
      name: i.nombre, value: i.stock, fill: COLORES_EMBUDO[idx % COLORES_EMBUDO.length]
    }));

    const graficoIngresos = [
      { name: 'Mano de Obra', value: totalManoObra },
      { name: 'Repuestos', value: totalRepuestos }
    ];

    // --- NUEVO: CÁLCULO PARA GRÁFICO DE PARETO (Rentabilidad por Servicio) ---
    // 1. Calcular cuánto dinero generó cada servicio (Distribuimos el totalFinal de la OT entre los servicios que se hicieron)
    const ingresosPorServicio = {};
    otsCerradasFiltradas.forEach(ot => {
      if (ot.servicios && ot.servicios.length > 0 && ot.totalFinal) {
        // Asumimos un reparto equitativo del total de la OT entre los servicios realizados en ella
        const valorPorServicio = ot.totalFinal / ot.servicios.length;
        ot.servicios.forEach(srv => {
          ingresosPorServicio[srv] = (ingresosPorServicio[srv] || 0) + valorPorServicio;
        });
      }
    });

    // 2. Ordenar de mayor a menor y agarrar el Top 10
    const paretoArrayBruto = Object.entries(ingresosPorServicio)
      .map(([nombre, facturacion]) => ({ nombre, facturacion }))
      .sort((a, b) => b.facturacion - a.facturacion)
      .slice(0, 10);

    // 3. Calcular el porcentaje acumulado para la línea del 80/20
    const totalFacturacionPareto = paretoArrayBruto.reduce((sum, item) => sum + item.facturacion, 0);
    let acumulado = 0;
    const graficoPareto = paretoArrayBruto.map(item => {
      acumulado += item.facturacion;
      return {
        ...item,
        // Acortamos el nombre para que entre en el gráfico
        nombreCorto: item.nombre.length > 20 ? item.nombre.substring(0, 20) + '...' : item.nombre,
        porcentajeAcumulado: totalFacturacionPareto > 0 ? Math.round((acumulado / totalFacturacionPareto) * 100) : 0
      };
    });

    return {
      ingresosPeriodo, porcentajeCrecimiento, otAbiertas, marcaTop, modeloTop, repuestoTopStr,
      graficoMarcas, topServicios, topStockInventario,
      facturacionTotal, totalManoObra, totalRepuestos, ticketPromedio, porcentajeCrecimientoFinanciero, graficoIngresos,
      graficoMeses, graficoPareto
    };

  }, [ots, inventario, filtroTiempo, filtroEstado]);

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
        <h2 className="text-2xl font-bold text-slate-700">Aún no hay datos suficientes</h2>
        <p className="text-slate-500 mt-2">Generá OTs y cargá tu inventario para ver las estadísticas.</p>
      </div>
    );
  }

  const data = dashboardData;
  const maxServicioCantidad = data.topServicios.length > 0 ? data.topServicios[0].cantidad : 1;

  const FunnelTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-lg p-3 rounded-lg">
          <p className="font-bold text-slate-800 text-sm mb-1">{payload[0].payload.name}</p>
          <p className="text-blue-600 font-semibold text-sm">Stock disponible: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // Tooltip personalizado para el gráfico de Pareto
  const ParetoTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 shadow-xl p-4 rounded-lg">
          <p className="font-bold text-white text-sm mb-2 pb-2 border-b border-slate-700">{label}</p>
          <p className="text-emerald-400 font-medium text-sm mb-1">
            Facturación: ${formatearMiles(payload[0].value)}
          </p>
          <p className="text-amber-400 font-medium text-sm">
            Acumulado: {payload[1].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <LayoutDashboard className="text-blue-600" size={32} />
            Graficos y KPIs
          </h2>
          <p className="mt-2 text-slate-500">Métricas en tiempo real procesadas desde tu base de datos.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative inline-block">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" size={16} />
            <select 
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 pl-9 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer text-sm"
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
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 pl-9 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer text-sm"
            >
              <option>Este Mes</option>
              <option>Últimos 3 Meses</option>
              <option>Últimos 6 Meses</option>
              <option>Últimos 12 Meses</option>
              <option>Este Año (2026)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      {/* SISTEMA DE SOLAPAS (TABS) */}
      <div className="flex border-b border-slate-200 mb-8 mt-6">
        <button
          onClick={() => setActiveTab('operaciones')}
          className={`pb-4 px-6 font-bold text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'operaciones' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Wrench size={18} /> Operaciones y Taller
          {activeTab === 'operaciones' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></div>}
        </button>
        <button
          onClick={() => setActiveTab('finanzas')}
          className={`pb-4 px-6 font-bold text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'finanzas' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <DollarSign size={18} /> Finanzas y Facturación
          {activeTab === 'finanzas' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-md"></div>}
        </button>
      </div>


      {/* ========================================= */}
      {/* 🚀 SOLAPA 1: OPERACIONES                  */}
      {/* ========================================= */}
      {activeTab === 'operaciones' && (
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ingresos</p>
                  <h3 className="text-3xl font-black text-slate-800">{data.ingresosPeriodo}</h3>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600"><Car size={20} /></div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                {data.porcentajeCrecimiento >= 0 ? (
                  <><TrendingUp size={14} className="text-emerald-500 mr-1" /><span className="text-emerald-600 font-bold">+{data.porcentajeCrecimiento}%</span></>
                ) : (
                  <><TrendingDown size={14} className="text-red-500 mr-1" /><span className="text-red-600 font-bold">{data.porcentajeCrecimiento}%</span></>
                )}
                <span className="text-slate-500 ml-1 truncate">vs mes ant.</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Taller Ahora</p>
                  <h3 className="text-3xl font-black text-slate-800">{data.otAbiertas}</h3>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg text-amber-500"><Wrench size={20} /></div>
              </div>
              <div className="mt-3 text-xs text-slate-500">Órdenes Abiertas</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Marca Top</p>
                  <h3 className="text-lg font-bold text-slate-800 mt-1 truncate max-w-[100px]">{data.marcaTop}</h3>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600"><TrendingUp size={20} /></div>
              </div>
              <div className="mt-3 text-xs text-slate-500">Según filtros</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Modelo Top</p>
                  <h3 className="text-lg font-bold text-slate-800 mt-1 truncate max-w-[100px]">{data.modeloTop}</h3>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600"><Calendar size={20} /></div>
              </div>
              <div className="mt-3 text-xs text-slate-500">Según filtros</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow ring-1 ring-blue-500/20 bg-gradient-to-br from-white to-blue-50/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Pieza Más Usada</p>
                  <h3 className="text-lg font-bold text-slate-800 mt-1 line-clamp-2 leading-tight" title={data.repuestoTopStr}>
                    {data.repuestoTopStr}
                  </h3>
                </div>
                <div className="bg-blue-600 p-2.5 rounded-lg text-white"><Package size={20} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Ingresos de Vehículos en el Tiempo</h3>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.graficoMeses} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="autos" name="Autos Ingresados" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Distribución por Marcas</h3>
              <div className="flex-1 min-h-[250px] w-full relative">
                {data.graficoMarcas.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.graficoMarcas} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {data.graficoMarcas.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_MARCAS[index % COLORES_MARCAS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Wrench className="text-slate-400" size={20} /> Servicios Más Solicitados (Checklist)
              </h3>
              <div className="overflow-x-auto">
                {data.topServicios.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No hay servicios registrados.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Servicio Realizado</th>
                        <th className="pb-3 font-semibold text-right">Cant.</th>
                        <th className="pb-3 font-semibold text-right w-1/3">Volumen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topServicios.map((servicio, index) => (
                        <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-slate-800 font-medium">{servicio.nombre}</td>
                          <td className="py-4 text-right font-bold text-slate-600">{servicio.cantidad}</td>
                          <td className="py-4 text-right">
                            <div className="w-full bg-slate-100 rounded-full h-2.5 max-w-[120px] ml-auto">
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

            <div className="lg:col-span-1 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Package className="text-blue-500" size={20} /> Top 10 Stock Disponible
              </h3>
              <p className="text-xs text-slate-500 mb-6">Piezas con mayor cantidad en inventario</p>
              <div className="flex-1 w-full min-h-[300px] relative flex flex-col items-center justify-center">
                {data.topStockInventario.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center">No hay repuestos con stock disponible.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <RechartsTooltip content={<FunnelTooltip />} />
                      <Funnel dataKey="value" data={data.topStockInventario} isAnimationActive>
                        <LabelList position="right" fill="#475569" stroke="none" dataKey="name" className="text-xs font-medium" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================= */}
      {/* 💰 SOLAPA 2: FINANZAS Y FACTURACIÓN       */}
      {/* ========================================= */}
      {activeTab === 'finanzas' && (
        <div className="animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-md text-white border border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Facturación Total</p>
                  <h3 className="text-4xl font-black">${formatearMiles(data.facturacionTotal)}</h3>
                </div>
                <div className="bg-emerald-500/20 p-3 rounded-lg text-emerald-400"><DollarSign size={24} /></div>
              </div>
              <div className="flex items-center text-sm bg-slate-950/50 inline-flex px-3 py-1.5 rounded-full">
                {data.porcentajeCrecimientoFinanciero >= 0 ? (
                  <><TrendingUp size={16} className="text-emerald-400 mr-1.5" /><span className="text-white font-medium">+{data.porcentajeCrecimientoFinanciero}% vs mes ant.</span></>
                ) : (
                  <><TrendingDown size={16} className="text-red-400 mr-1.5" /><span className="text-white font-medium">{data.porcentajeCrecimientoFinanciero}% vs mes ant.</span></>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ticket Promedio</p>
                  <h3 className="text-3xl font-black text-slate-800">${formatearMiles(data.ticketPromedio)}</h3>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><CreditCard size={24} /></div>
              </div>
              <p className="text-sm text-slate-500 mt-2">Gasto promedio por cada vehículo (OT Cerrada).</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ganancia Neta (M. de Obra)</p>
                  <h3 className="text-3xl font-black text-slate-800">${formatearMiles(data.totalManoObra)}</h3>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-purple-600"><Wallet size={24} /></div>
              </div>
              <p className="text-sm text-slate-500 mt-2">Rentabilidad directa por servicio sin repuestos.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Evolución de la Facturación ($)</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.graficoMeses} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFacturacion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis 
                      axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} 
                      tickFormatter={(value) => `$${formatearMiles(value)}`} 
                      width={80}
                    />
                    <RechartsTooltip 
                      formatter={(value) => [`$${formatearMiles(value)}`, 'Facturación']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                    />
                    <Area type="monotone" dataKey="facturacion" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFacturacion)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Distribución de Ingresos</h3>
              <p className="text-xs text-slate-500 mb-6">Mano de Obra vs. Reventa de Repuestos</p>
              <div className="flex-1 min-h-[250px] w-full relative">
                {data.facturacionTotal === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Sin facturación registrada</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={data.graficoIngresos} 
                        cx="50%" cy="50%" 
                        innerRadius={70} outerRadius={90} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {data.graficoIngresos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_FINANZAS[index % COLORES_FINANZAS.length]} />)}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [`$${formatearMiles(value)}`, 'Ingreso']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* NUEVO: GRÁFICO DE PARETO (Rentabilidad por Servicio) */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-amber-500" size={20} /> Rentabilidad por Tipo de Servicio (Top 10)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Análisis de Pareto: Qué servicios generan la mayor cantidad de ingresos (Barras = Dinero | Línea = % Acumulado).</p>
            </div>
            
            <div className="w-full h-[400px]">
              {data.graficoPareto.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No hay datos de facturación por servicio suficientes.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.graficoPareto} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    
                    <XAxis 
                      dataKey="nombreCorto" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }} 
                      angle={-45} 
                      textAnchor="end"
                      dy={10}
                    />
                    
                    <YAxis 
                      yAxisId="left" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      tickFormatter={(value) => `$${formatearMiles(value)}`} 
                    />
                    
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#fbbf24', fontSize: 12, fontWeight: 'bold' }} 
                      tickFormatter={(value) => `${value}%`} 
                      domain={[0, 100]}
                    />
                    
                    <RechartsTooltip content={<ParetoTooltip />} />
                    
                    <Bar yAxisId="left" dataKey="facturacion" name="Facturación" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {data.graficoPareto.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? '#10b981' : '#6ee7b7'} />
                      ))}
                    </Bar>
                    
                    <Line yAxisId="right" type="monotone" dataKey="porcentajeAcumulado" name="% Acumulado" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}