import { useState, useEffect } from 'react';
import { Search, Wrench, FileText, AlertTriangle, CheckCircle, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config'; 

export default function GestionOT() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [otsAbiertas, setOtsAbiertas] = useState([]);
  const [resultados, setResultados] = useState([]);
  
  const [otSeleccionada, setOtSeleccionada] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [informe, setInforme] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  useEffect(() => {
    const fetchOTsAbiertas = async () => {
      try {
        const q = query(collection(db, "ordenes"), where("estado", "==", "Abierta"));
        const querySnapshot = await getDocs(q);
        
        const abiertas = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          firebaseId: doc.id 
        }));

        setOtsAbiertas(abiertas);
        setResultados(abiertas); 
      } catch (error) {
        console.error("Error al traer las OTs: ", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchOTsAbiertas();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toUpperCase();
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setResultados(otsAbiertas);
      return;
    }

    const filtrados = otsAbiertas.filter(ot => 
      ot.patente.includes(term) || ot.id_ot.includes(term)
    );
    setResultados(filtrados);
  };

  const seleccionarOT = (ot) => {
    setOtSeleccionada(ot);
    setInforme(ot.informe || '');
    setDiagnostico(ot.diagnostico || '');
  };

  const handleFinalizar = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const otRef = doc(db, "ordenes", otSeleccionada.firebaseId);
      const ahora = new Date();
      
      // SOLUCIÓN ZONA HORARIA: Sacamos la fecha y hora local de cierre manualmente
      const year = ahora.getFullYear();
      const month = String(ahora.getMonth() + 1).padStart(2, '0');
      const day = String(ahora.getDate()).padStart(2, '0');
      const fechaCierre = `${year}-${month}-${day}`; 
      
      const horaCierre = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      await updateDoc(otRef, {
        estado: 'Cerrada',
        informe: informe,
        diagnostico: diagnostico,
        fechaCierre: fechaCierre,
        horaCierre: horaCierre
      });

      alert(`¡La ${otSeleccionada.id_ot} fue cerrada con éxito a las ${horaCierre} hs!`);
      
      const nuevasAbiertas = otsAbiertas.filter(ot => ot.firebaseId !== otSeleccionada.firebaseId);
      setOtsAbiertas(nuevasAbiertas);
      
      if (searchTerm) {
        setResultados(nuevasAbiertas.filter(ot => ot.patente.includes(searchTerm) || ot.id_ot.includes(searchTerm)));
      } else {
        setResultados(nuevasAbiertas);
      }

      setOtSeleccionada(null);

    } catch (error) {
      console.error("Error al cerrar la OT:", error);
      alert("Hubo un error al guardar. Revisá la consola.");
    } finally {
      setIsSubmitting(false);
    }
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
        
        {/* COLUMNA IZQUIERDA: Buscador y Resultados */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Buscar patente o N° OT..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>Cargando vehículos...</p>
              </div>
            ) : resultados.length === 0 ? (
              <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
                <CheckCircle size={40} className="mb-2 opacity-50 text-emerald-500" />
                <p className="text-slate-600 font-medium">No hay vehículos pendientes</p>
                <p className="text-sm mt-1">Todas las OTs están cerradas.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resultados.map(ot => (
                  <button
                    key={ot.firebaseId}
                    onClick={() => seleccionarOT(ot)}
                    className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between ${
                      otSeleccionada?.firebaseId === ot.firebaseId 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{ot.patente}</span>
                        <span className="text-xs text-slate-500">• {ot.id_ot}</span>
                      </div>
                      <div className="text-sm text-slate-600 truncate">{ot.marca} {ot.modelo}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        {ot.estado}
                      </span>
                      <ChevronRight size={16} className={otSeleccionada?.firebaseId === ot.firebaseId ? 'text-blue-600' : 'text-slate-400'} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Detalle y Finalización */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto">
          {!otSeleccionada ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <FileText size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-slate-600">Ninguna OT seleccionada</h3>
              <p className="mt-2">Seleccioná un vehículo de la lista para ver los trabajos solicitados y cerrar la orden.</p>
            </div>
          ) : (
            <div className="p-8">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{otSeleccionada.id_ot}</h3>
                  <div className="flex items-center gap-4 mt-2 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock size={16} /> 
                      Ingreso: {otSeleccionada.fecha} {otSeleccionada.horaIngreso ? `a las ${otSeleccionada.horaIngreso} hs` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded text-sm font-semibold bg-emerald-100 text-emerald-700">
                      Estado: {otSeleccionada.estado}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-800">{otSeleccionada.patente}</div>
                  <div className="text-slate-600">{otSeleccionada.marca} {otSeleccionada.modelo} ({otSeleccionada.anio})</div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Trabajos Solicitados (Check-in)</h4>
                <div className="flex flex-wrap gap-2">
                  {otSeleccionada.servicios?.map(srv => (
                    <span key={srv} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-sm flex items-center gap-2">
                      <CheckCircle size={14} className="text-blue-500" />
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

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
                    className="w-full rounded-lg border border-slate-300 p-4 focus:ring-2 focus:ring-blue-600 outline-none resize-none"
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
                    className="w-full rounded-lg border border-amber-200 bg-amber-50/30 p-4 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Finalizar y Cerrar OT
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}