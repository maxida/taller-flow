import { useState } from 'react';
import { History, Search, Calendar, Car, FileText, AlertTriangle, CheckCircle, X, Wrench } from 'lucide-react';

// MOCK DE DATOS: Ampliamos un poco los datos para probar bien los filtros
const MOCK_OTS = [
  { id: 'OT-0001', patente: 'AB123CD', marca: 'Volkswagen', modelo: 'Gol Trend', anio: '2018', estado: 'Cerrada', servicios: ['Cambio de Aceite y Filtros', 'Alineación y Balanceo'], fecha: '2026-03-05', informe: 'Se cambió aceite sintético 5W40 y todos los filtros. Alineación perfecta.', diagnostico: 'Las pastillas de freno delanteras están a un 30%, revisar en el próximo service.' },
  { id: 'OT-0002', patente: 'LLL123', marca: 'Ford', modelo: 'Fiesta', anio: '2015', estado: 'Cerrada', servicios: ['Batería'], fecha: '2026-03-08', informe: 'Se reemplazó batería por una Moura 12x65 nueva con garantía de 12 meses.', diagnostico: 'Alternador cargando correctamente a 14.2v. Todo en orden.' },
  { id: 'OT-0003', patente: 'XYZ987', marca: 'Toyota', modelo: 'Hilux', anio: '2021', estado: 'Abierta', servicios: ['Revisión General de 20 Puntos', 'Escaneo Computarizado (OBD2)'], fecha: '2026-03-09', informe: '', diagnostico: '' },
  { id: 'OT-0004', patente: 'AB123CD', marca: 'Volkswagen', modelo: 'Gol Trend', anio: '2018', estado: 'Cerrada', servicios: ['Cambio de Pastillas y Discos'], fecha: '2026-01-15', informe: 'Se rectificaron discos y se pusieron pastillas de cerámica.', diagnostico: 'Líquido de frenos cambiado. Próximo cambio en 2 años.' },
];

export default function Historial() {
  // Estados para los 3 filtros
  const [filtroPatente, setFiltroPatente] = useState('');
  const [filtroOT, setFiltroOT] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Estado para el modal
  const [otSeleccionada, setOtSeleccionada] = useState(null);

  // Lógica de filtrado en tiempo real y orden ascendente por fecha
  const otsFiltradas = MOCK_OTS.filter(ot => {
    const coincidePatente = ot.patente.toLowerCase().includes(filtroPatente.toLowerCase());
    const coincideOT = ot.id.toLowerCase().includes(filtroOT.toLowerCase());
    const coincideFecha = filtroFecha ? ot.fecha === filtroFecha : true;
    
    return coincidePatente && coincideOT && coincideFecha;
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // Orden ascendente como pediste

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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar por Patente</label>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={filtroPatente}
              onChange={(e) => setFiltroPatente(e.target.value)}
              placeholder="Ej: AB123CD"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar por N° OT</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={filtroOT}
              onChange={(e) => setFiltroOT(e.target.value)}
              placeholder="Ej: OT-0001"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Ingreso</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 text-sm"
            />
          </div>
        </div>
      </div>

      {/* GRILLA DE TARJETAS */}
      {otsFiltradas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <History size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No se encontraron órdenes de trabajo</h3>
          <p className="text-slate-500 mt-1">Probá ajustando o limpiando los filtros de búsqueda.</p>
          <button 
            onClick={() => { setFiltroPatente(''); setFiltroOT(''); setFiltroFecha(''); }}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otsFiltradas.map((ot) => (
            <div 
              key={ot.id} 
              onClick={() => setOtSeleccionada(ot)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all p-5 flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{ot.patente}</h3>
                  <p className="text-sm font-medium text-slate-500">{ot.id}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  ot.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {ot.estado}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-4">
                <Calendar size={16} />
                <span>{new Date(ot.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-100">
                <p className="font-semibold text-slate-700 truncate">{ot.marca} {ot.modelo}</p>
                <p className="text-sm text-slate-500 truncate mt-1">
                  {ot.servicios.length} {ot.servicios.length === 1 ? 'trabajo' : 'trabajos'} • {ot.servicios[0]} {ot.servicios.length > 1 && '...'}
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
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Detalle de {otSeleccionada.id}</h3>
                <p className="text-slate-500 font-medium">{otSeleccionada.patente} • {otSeleccionada.marca} {otSeleccionada.modelo} ({otSeleccionada.anio})</p>
              </div>
              <button 
                onClick={() => setOtSeleccionada(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Fecha de Ingreso</p>
                  <p className="text-slate-800 font-medium mt-1">{new Date(otSeleccionada.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Estado Actual</p>
                  <p className={`font-bold mt-1 ${otSeleccionada.estado === 'Abierta' ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {otSeleccionada.estado}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Wrench size={18} className="text-blue-500" /> Trabajos Solicitados
                </h4>
                <ul className="space-y-2">
                  {otSeleccionada.servicios.map((srv, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm">
                      <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      {srv}
                    </li>
                  ))}
                </ul>
              </div>

              {otSeleccionada.estado === 'Cerrada' && (
                <>
                  <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <FileText size={18} className="text-blue-600" /> Informe del Mecánico
                    </h4>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{otSeleccionada.informe}</p>
                  </div>

                  <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-500" /> Diagnóstico a Futuro
                    </h4>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{otSeleccionada.diagnostico}</p>
                  </div>
                </>
              )}

              {otSeleccionada.estado === 'Abierta' && (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500">Esta orden aún está abierta. Podés cerrarla desde la sección <b>Gestión de OT</b>.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}