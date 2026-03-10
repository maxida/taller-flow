import { useState, useEffect } from 'react';
import { History, Search, Calendar, Car, FileText, AlertTriangle, CheckCircle, X, Wrench, Filter, Loader2, Clock, Package } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config'; 

export default function Historial() {
  const [ots, setOts] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  // Estados para los 5 filtros
  const [filtroPatente, setFiltroPatente] = useState('');
  const [filtroOT, setFiltroOT] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroFechaCierre, setFiltroFechaCierre] = useState(''); 
  const [filtroEstado, setFiltroEstado] = useState('Todas'); 

  const [otSeleccionada, setOtSeleccionada] = useState(null);

  // Función infalible para formatear fechas
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  useEffect(() => {
    const fetchOTs = async () => {
      try {
        const q = query(collection(db, "ordenes"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        const historialOTs = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          firebaseId: doc.id
        }));

        setOts(historialOTs);
      } catch (error) {
        console.error("Error al traer el historial: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOTs();
  }, []);

  const otsFiltradas = ots.filter(ot => {
    const coincidePatente = ot.patente?.toLowerCase().includes(filtroPatente.toLowerCase());
    const coincideOT = ot.id_ot?.toLowerCase().includes(filtroOT.toLowerCase());
    const coincideFecha = filtroFecha ? ot.fecha === filtroFecha : true;
    const coincideFechaCierre = filtroFechaCierre ? ot.fechaCierre === filtroFechaCierre : true; 
    const coincideEstado = filtroEstado === 'Todas' ? true : ot.estado === filtroEstado;
    
    return coincidePatente && coincideOT && coincideFecha && coincideFechaCierre && coincideEstado;
  });

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <History className="text-blue-600" size={32} />
          Historial de Vehículos
        </h2>
        <p className="mt-2 text-slate-500">Buscá y consultá el registro histórico de todos los trabajos realizados.</p>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patente</label>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={filtroPatente} onChange={(e) => setFiltroPatente(e.target.value)} placeholder="Ej: AB123CD" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase text-sm" />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">N° OT</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={filtroOT} onChange={(e) => setFiltroOT(e.target.value)} placeholder="Ej: OT-0001" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">F. Ingreso</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">F. Cierre</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="date" value={filtroFechaCierre} onChange={(e) => setFiltroFechaCierre(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 text-sm bg-white">
              <option value="Todas">Todas</option>
              <option value="Abierta">Abiertas</option>
              <option value="Cerrada">Cerradas</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-600">Cargando historial...</h3>
        </div>
      ) : otsFiltradas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <History size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No se encontraron órdenes de trabajo</h3>
          <button onClick={() => { setFiltroPatente(''); setFiltroOT(''); setFiltroFecha(''); setFiltroFechaCierre(''); setFiltroEstado('Todas'); }} className="mt-4 text-blue-600 hover:text-blue-800 font-medium">Limpiar Filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otsFiltradas.map((ot) => (
            <div key={ot.firebaseId} onClick={() => setOtSeleccionada(ot)} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all p-5 flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{ot.patente}</h3>
                  <p className="text-sm font-medium text-slate-500">{ot.id_ot}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ot.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{ot.estado}</span>
              </div>
              
              <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-slate-600 text-xs">
                  <Calendar size={14} className="text-blue-500" />
                  <span><span className="font-semibold">Ingreso:</span> {formatearFecha(ot.fecha)} {ot.horaIngreso ? `a las ${ot.horaIngreso}` : ''}</span>
                </div>
                {ot.estado === 'Cerrada' && ot.fechaCierre && (
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span><span className="font-semibold">Cierre:</span> {formatearFecha(ot.fechaCierre)} {ot.horaCierre ? `a las ${ot.horaCierre}` : ''}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-3 border-t border-slate-100">
                <p className="font-semibold text-slate-700 truncate">{ot.marca} {ot.modelo}</p>
                <p className="text-xs text-slate-500 truncate mt-1">
                  {ot.servicios?.length || 0} {(ot.servicios?.length || 0) === 1 ? 'trabajo' : 'trabajos'} • {ot.servicios?.[0] || 'Sin trabajos'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DETALLE DE OT */}
      {otSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Detalle de {otSeleccionada.id_ot}</h3>
                <p className="text-slate-500 font-medium">{otSeleccionada.patente} • {otSeleccionada.marca} {otSeleccionada.modelo} ({otSeleccionada.anio})</p>
              </div>
              <button onClick={() => setOtSeleccionada(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Ingreso</p>
                  <p className="text-slate-800 font-medium mt-1">
                    {formatearFecha(otSeleccionada.fecha)}
                    {otSeleccionada.horaIngreso ? ` - ${otSeleccionada.horaIngreso} hs` : ''}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Estado y Cierre</p>
                  <p className={`font-bold mt-1 ${otSeleccionada.estado === 'Abierta' ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {otSeleccionada.estado}
                  </p>
                  {otSeleccionada.estado === 'Cerrada' && otSeleccionada.fechaCierre && (
                    <p className="text-xs text-slate-500 mt-1">
                      Finalizado el {formatearFecha(otSeleccionada.fechaCierre)}
                      {otSeleccionada.horaCierre ? ` a las ${otSeleccionada.horaCierre}` : ''}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Wrench size={18} className="text-blue-500" /> Trabajos Solicitados</h4>
                <ul className="space-y-2">
                  {otSeleccionada.servicios?.map((srv, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm"><CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />{srv}</li>
                  ))}
                </ul>
              </div>

              {/* NUEVA SECCIÓN: REPUESTOS UTILIZADOS EN EL HISTORIAL */}
              {otSeleccionada.repuestosUtilizados && otSeleccionada.repuestosUtilizados.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Package size={18} className="text-blue-500" /> Repuestos Utilizados
                  </h4>
                  <ul className="space-y-2">
                    {otSeleccionada.repuestosUtilizados.map((rep, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-600 text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded text-xs flex-shrink-0">
                          {rep.cantidad}x
                        </span>
                        <span className="font-medium text-slate-700">{rep.nombre}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {otSeleccionada.estado === 'Cerrada' && (
                <>
                  <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Informe del Mecánico</h4>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{otSeleccionada.informe || 'No hay informe registrado.'}</p>
                  </div>
                  <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Diagnóstico a Futuro</h4>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{otSeleccionada.diagnostico || 'No hay diagnóstico registrado.'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}