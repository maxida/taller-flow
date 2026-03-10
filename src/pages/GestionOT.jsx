import { useState } from 'react';
import { Search, Wrench, FileText, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';

// MOCK DE DATOS: Simulamos la base de datos para poder probar la búsqueda
const MOCK_OTS = [
  { id: 'OT-0001', patente: 'AB123CD', marca: 'Volkswagen', modelo: 'Gol Trend', anio: '2018', estado: 'Abierta', servicios: ['Cambio de Aceite y Filtros', 'Alineación y Balanceo'], fecha: '2026-03-09' },
  { id: 'OT-0002', patente: 'LLL123', marca: 'Ford', modelo: 'Fiesta', anio: '2015', estado: 'Cerrada', servicios: ['Batería'], fecha: '2026-03-01' },
  { id: 'OT-0003', patente: 'AB123CD', marca: 'Volkswagen', modelo: 'Gol Trend', anio: '2018', estado: 'Cerrada', servicios: ['Cambio de Pastillas'], fecha: '2025-10-15' },
];

export default function GestionOT() {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultados, setResultados] = useState([]);
  const [otSeleccionada, setOtSeleccionada] = useState(null);
  
  // Estados para los campos de texto
  const [informe, setInforme] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  // Función para buscar (Simula la consulta a Firebase)
  const handleSearch = (e) => {
    const term = e.target.value.toUpperCase();
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setResultados([]);
      return;
    }

    const filtrados = MOCK_OTS.filter(ot => 
      ot.patente.includes(term) || ot.id.includes(term)
    );
    setResultados(filtrados);
  };

  const seleccionarOT = (ot) => {
    setOtSeleccionada(ot);
    // Limpiamos los textareas al abrir una nueva OT
    setInforme(ot.informe || '');
    setDiagnostico(ot.diagnostico || '');
  };

  const handleFinalizar = (e) => {
    e.preventDefault();
    console.log("Cerrando OT:", otSeleccionada.id, { informe, diagnostico });
    alert(`¡La ${otSeleccionada.id} fue cerrada con éxito!`);
    
    // Aquí luego actualizaremos el estado en Firebase
    setOtSeleccionada(null);
    setSearchTerm('');
    setResultados([]);
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Wrench className="text-blue-600" size={32} />
          Gestión de Órdenes de Trabajo
        </h2>
        <p className="mt-2 text-slate-500">Buscá una OT o Patente para finalizar el trabajo y dejar el diagnóstico.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* COLUMNA IZQUIERDA: Buscador y Resultados (1 tercio) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Buscar patente o N° OT..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none uppercase"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {resultados.length === 0 && searchTerm !== '' && (
              <p className="text-center text-slate-500 mt-4">No se encontraron resultados.</p>
            )}
            {resultados.length === 0 && searchTerm === '' && (
              <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
                <Search size={40} className="mb-2 opacity-50" />
                <p>Escribí para empezar a buscar</p>
              </div>
            )}
            
            <div className="space-y-2">
              {resultados.map(ot => (
                <button
                  key={ot.id}
                  onClick={() => seleccionarOT(ot)}
                  className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between ${
                    otSeleccionada?.id === ot.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800">{ot.patente}</span>
                      <span className="text-xs text-slate-500">• {ot.id}</span>
                    </div>
                    <div className="text-sm text-slate-600 truncate">{ot.marca} {ot.modelo}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      ot.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {ot.estado}
                    </span>
                    <ChevronRight size={16} className={otSeleccionada?.id === ot.id ? 'text-blue-600' : 'text-slate-400'} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Detalle y Finalización (2 tercios) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto">
          {!otSeleccionada ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <FileText size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-slate-600">Ninguna OT seleccionada</h3>
              <p className="mt-2">Buscá y seleccioná una Orden de Trabajo en el panel izquierdo para ver sus detalles y finalizarla.</p>
            </div>
          ) : (
            <div className="p-8">
              {/* Header de la OT seleccionada */}
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{otSeleccionada.id}</h3>
                  <div className="flex items-center gap-4 mt-2 text-slate-600">
                    <span className="flex items-center gap-1"><Clock size={16} /> Ingreso: {otSeleccionada.fecha}</span>
                    <span className={`px-2 py-0.5 rounded text-sm font-semibold ${otSeleccionada.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      Estado: {otSeleccionada.estado}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-800">{otSeleccionada.patente}</div>
                  <div className="text-slate-600">{otSeleccionada.marca} {otSeleccionada.modelo} ({otSeleccionada.anio})</div>
                </div>
              </div>

              {/* Lista de trabajos solicitados */}
              <div className="mb-8">
                <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Trabajos Solicitados (Check-in)</h4>
                <div className="flex flex-wrap gap-2">
                  {otSeleccionada.servicios.map(srv => (
                    <span key={srv} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-sm flex items-center gap-2">
                      <CheckCircle size={14} className="text-blue-500" />
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              {/* Formulario de Cierre (Solo si está abierta) */}
              {otSeleccionada.estado === 'Abierta' ? (
                <form onSubmit={handleFinalizar} className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                      <FileText size={18} className="text-blue-600" />
                      Informe General del Trabajo Realizado
                    </label>
                    <textarea
                      value={informe}
                      onChange={(e) => setInforme(e.target.value)}
                      required
                      rows={4}
                      placeholder="Detalle los trabajos realizados, repuestos utilizados, etc."
                      className="w-full rounded-lg border border-slate-300 p-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                      <AlertTriangle size={18} className="text-amber-500" />
                      Diagnóstico a Futuro (Valor Agregado)
                    </label>
                    <textarea
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                      required
                      rows={3}
                      placeholder="Ej: Se recomienda cambiar las cubiertas delanteras en 5.000 km..."
                      className="w-full rounded-lg border border-amber-200 bg-amber-50/30 p-4 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Finalizar y Cerrar OT
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                  <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4 opacity-50" />
                  <h4 className="text-lg font-bold text-slate-700">Esta Orden de Trabajo ya está cerrada</h4>
                  <p className="text-slate-500 mt-2">Podés ver su historial completo en la sección de "Historial".</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}