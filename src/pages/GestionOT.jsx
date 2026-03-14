import { useState, useEffect } from 'react';
import { Search, Wrench, FileText, AlertTriangle, CheckCircle, Clock, ChevronRight, Loader2, Package, Plus, Minus, Trash2, Camera } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, increment, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

// Diccionario para traducir la clave de la base de datos a un nombre lindo para el usuario
const ZONAS_FOTOS_LABELS = {
  tablero: 'Tablero / Km',
  frente: 'Frente',
  trasera: 'Parte Trasera',
  izquierdo: 'Lat. Izquierdo',
  derecho: 'Lat. Derecho'
};

export default function GestionOT() {
  // --- ESTADOS ORIGINALES DE OT ---
  const [searchTerm, setSearchTerm] = useState('');
  const [otsAbiertas, setOtsAbiertas] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [otSeleccionada, setOtSeleccionada] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [informe, setInforme] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  // --- ESTADOS NUEVOS PARA INVENTARIO ---
  const [inventario, setInventario] = useState([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);
  const [busquedaRepuesto, setBusquedaRepuesto] = useState('');

  // 1. Efecto: Trae las OTs Abiertas y el Inventario al cargar la pantalla
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Traemos OTs abiertas
        const qOTs = query(collection(db, "ordenes"), where("estado", "==", "Abierta"));
        const snapshotOTs = await getDocs(qOTs);
        const abiertas = snapshotOTs.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        setOtsAbiertas(abiertas);
        setResultados(abiertas);

        // Traemos Inventario completo
        const qInv = query(collection(db, "inventario"), orderBy("nombre"));
        const snapshotInv = await getDocs(qInv);
        const itemsInv = snapshotInv.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInventario(itemsInv);

      } catch (error) {
        console.error("Error al traer datos: ", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Búsqueda de OTs
  const handleSearch = (e) => {
    const term = e.target.value.toUpperCase();
    setSearchTerm(term);
    if (term.trim() === '') {
      setResultados(otsAbiertas);
      return;
    }
    const filtrados = otsAbiertas.filter(ot => ot.patente.includes(term) || ot.id_ot.includes(term));
    setResultados(filtrados);
  };

  // Al seleccionar una OT, limpiamos los campos y los repuestos
  const seleccionarOT = (ot) => {
    setOtSeleccionada(ot);
    setInforme(ot.informe || '');
    setDiagnostico(ot.diagnostico || '');
    setRepuestosSeleccionados([]);
    setBusquedaRepuesto('');
  };

  // --- LÓGICA DE REPUESTOS ---
  
  // Filtramos el inventario según lo que escribe el mecánico (ocultamos los que ya seleccionó)
  const repuestosSugeridos = busquedaRepuesto.trim() === '' ? [] : inventario.filter(item => 
    item.nombre.toLowerCase().includes(busquedaRepuesto.toLowerCase()) && 
    !repuestosSeleccionados.find(r => r.id === item.id)
  ).slice(0, 5); // Mostramos máximo 5 sugerencias

  const agregarRepuesto = (item) => {
    if (item.stock <= 0) {
      alert("¡No hay stock de este repuesto!");
      return;
    }
    setRepuestosSeleccionados([...repuestosSeleccionados, { ...item, cantidadUsada: 1 }]);
    setBusquedaRepuesto(''); // Limpiamos el buscador
  };

  const modificarCantidadRepuesto = (id, delta) => {
    setRepuestosSeleccionados(prev => prev.map(rep => {
      if (rep.id === id) {
        const nuevaCantidad = rep.cantidadUsada + delta;
        // Validamos que no baje de 1 y que no supere el stock real disponible
        if (nuevaCantidad > 0 && nuevaCantidad <= rep.stock) {
          return { ...rep, cantidadUsada: nuevaCantidad };
        }
      }
      return rep;
    }));
  };

  const eliminarRepuesto = (id) => {
    setRepuestosSeleccionados(repuestosSeleccionados.filter(rep => rep.id !== id));
  };

  // --- LÓGICA DE CIERRE DE OT ---
  const handleFinalizar = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ahora = new Date();
      const year = ahora.getFullYear();
      const month = String(ahora.getMonth() + 1).padStart(2, '0');
      const day = String(ahora.getDate()).padStart(2, '0');
      const fechaCierre = `${year}-${month}-${day}`;
      const horaCierre = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      // 1. DESCONTAR STOCK DEL INVENTARIO (Transacción paralela)
      const updateInventarioPromises = repuestosSeleccionados.map(rep => {
        const repRef = doc(db, "inventario", rep.id);
        // Usamos increment con valor negativo para restar directo en la DB
        return updateDoc(repRef, { stock: increment(-rep.cantidadUsada) });
      });
      await Promise.all(updateInventarioPromises);

      // 2. ACTUALIZAR LA OT
      const otRef = doc(db, "ordenes", otSeleccionada.firebaseId);
      
      // Guardamos un resumen limpio de los repuestos usados
      const repuestosGuardar = repuestosSeleccionados.map(r => ({
        id: r.id,
        nombre: r.nombre,
        cantidad: r.cantidadUsada
      }));

      await updateDoc(otRef, {
        estado: 'Cerrada',
        informe: informe,
        diagnostico: diagnostico,
        repuestosUtilizados: repuestosGuardar, // <-- Guardamos la lista en la OT
        fechaCierre: fechaCierre,
        horaCierre: horaCierre
      });

      alert(`¡La ${otSeleccionada.id_ot} fue cerrada con éxito y el inventario se actualizó!`);
      
      // 3. ACTUALIZAR UI LOCAL
      const nuevasAbiertas = otsAbiertas.filter(ot => ot.firebaseId !== otSeleccionada.firebaseId);
      setOtsAbiertas(nuevasAbiertas);
      setResultados(searchTerm ? nuevasAbiertas.filter(ot => ot.patente.includes(searchTerm) || ot.id_ot.includes(searchTerm)) : nuevasAbiertas);
      
      setInventario(prev => prev.map(item => {
        const usado = repuestosSeleccionados.find(r => r.id === item.id);
        if (usado) {
          return { ...item, stock: item.stock - usado.cantidadUsada };
        }
        return item;
      }));

      setOtSeleccionada(null);

    } catch (error) {
      console.error("Error al cerrar la OT:", error);
      alert("Hubo un error al procesar el cierre. Revisá la consola.");
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
        <p className="mt-2 text-slate-500">Completá el informe, registrá repuestos usados y cerrá la OT.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* COLUMNA IZQUIERDA: Buscador de OT */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" value={searchTerm} onChange={handleSearch} placeholder="Buscar patente o N° OT..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400"><Loader2 className="animate-spin mb-2" size={32} /><p>Cargando...</p></div>
            ) : resultados.length === 0 ? (
              <div className="text-center text-slate-400 mt-10 flex flex-col items-center"><CheckCircle size={40} className="mb-2 opacity-50 text-emerald-500" /><p className="text-slate-600 font-medium">No hay vehículos pendientes</p></div>
            ) : (
              <div className="space-y-2">
                {resultados.map(ot => (
                  <button key={ot.firebaseId} onClick={() => seleccionarOT(ot)} className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between ${otSeleccionada?.firebaseId === ot.firebaseId ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className="font-bold text-slate-800">{ot.patente}</span><span className="text-xs text-slate-500">• {ot.id_ot}</span></div>
                      <div className="text-sm text-slate-600 truncate">{ot.marca} {ot.modelo}</div>
                    </div>
                    <ChevronRight size={16} className={otSeleccionada?.firebaseId === ot.firebaseId ? 'text-blue-600' : 'text-slate-400'} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Detalle, Repuestos y Cierre */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto relative">
          {!otSeleccionada ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <FileText size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-slate-600">Ninguna OT seleccionada</h3>
              <p className="mt-2">Seleccioná un vehículo de la lista para ver los detalles y cerrar la orden.</p>
            </div>
          ) : (
            <div className="p-8">
              {/* Encabezado */}
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{otSeleccionada.id_ot}</h3>
                  <div className="flex items-center gap-4 mt-2 text-slate-600">
                    <span className="flex items-center gap-1"><Clock size={16} /> Ingreso: {otSeleccionada.fecha} {otSeleccionada.horaIngreso ? `a las ${otSeleccionada.horaIngreso}` : ''}</span>
                    <span className="px-2 py-0.5 rounded text-sm font-semibold bg-emerald-100 text-emerald-700">{otSeleccionada.estado}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-800">{otSeleccionada.patente}</div>
                  <div className="text-slate-600">{otSeleccionada.marca} {otSeleccionada.modelo} ({otSeleccionada.anio})</div>
                </div>
              </div>

              {/* NUEVA SECCIÓN: ESTADO VISUAL (FOTOS) */}
              {otSeleccionada.fotos && Object.keys(otSeleccionada.fotos).length > 0 && (
                <div className="mb-8 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Camera size={18} className="text-blue-500" />
                    Estado Visual al Ingreso
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(otSeleccionada.fotos).map(([zona, url]) => (
                      <a 
                        key={zona} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="group relative rounded-lg overflow-hidden border border-slate-200 h-24 bg-white block hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
                        title="Haz clic para ampliar"
                      >
                        <img 
                          src={url} 
                          alt={zona} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent pt-6 pb-1.5 px-1">
                          <p className="text-white text-[10px] font-bold uppercase tracking-wider text-center truncate shadow-sm">
                             {ZONAS_FOTOS_LABELS[zona] || zona}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Trabajos del Check-In */}
              <div className="mb-8">
                <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Trabajos Solicitados (Check-in)</h4>
                <div className="flex flex-wrap gap-2">
                  {otSeleccionada.servicios?.map(srv => (
                    <span key={srv} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-sm flex items-center gap-2">
                      <CheckCircle size={14} className="text-blue-500" /> {srv}
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleFinalizar} className="space-y-8">
                
                {/* SECCIÓN DE REPUESTOS */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                    <Package className="text-blue-600" size={20} /> Repuestos Utilizados (Descuenta Stock)
                  </h4>
                  
                  {/* Buscador de Repuestos */}
                  <div className="relative mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={busquedaRepuesto} 
                        onChange={(e) => setBusquedaRepuesto(e.target.value)} 
                        placeholder="Buscar repuesto por nombre..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                      />
                    </div>

                    {/* Menú Flotante de Resultados */}
                    {repuestosSugeridos.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                        {repuestosSugeridos.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => agregarRepuesto(item)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 flex justify-between items-center transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-slate-800">{item.nombre}</p>
                              <p className="text-xs text-slate-500">{item.categoria} • {item.compatibilidad}</p>
                            </div>
                            <span className={`text-sm font-bold ${item.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              Stock: {item.stock}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lista de Seleccionados */}
                  {repuestosSeleccionados.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      {repuestosSeleccionados.map((rep) => (
                        <div key={rep.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-slate-50">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-700 text-sm">{rep.nombre}</p>
                            <p className="text-xs text-slate-400">Stock disp: {rep.stock}</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-100 rounded-md border border-slate-200">
                              <button type="button" onClick={() => modificarCantidadRepuesto(rep.id, -1)} className="p-1.5 text-slate-500 hover:text-slate-800"><Minus size={14}/></button>
                              <span className="w-8 text-center font-bold text-sm text-slate-800">{rep.cantidadUsada}</span>
                              <button type="button" onClick={() => modificarCantidadRepuesto(rep.id, 1)} disabled={rep.cantidadUsada >= rep.stock} className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30"><Plus size={14}/></button>
                            </div>
                            <button type="button" onClick={() => eliminarRepuesto(rep.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Informe y Diagnóstico */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2"><FileText size={18} className="text-blue-600" /> Informe General del Trabajo Realizado</label>
                  <textarea value={informe} onChange={(e) => setInforme(e.target.value)} required rows={4} placeholder="Detalle los trabajos realizados..." className="w-full rounded-lg border border-slate-300 p-4 focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2"><AlertTriangle size={18} className="text-amber-500" /> Diagnóstico a Futuro (Valor Agregado)</label>
                  <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} required rows={3} placeholder="Ej: Se recomienda cambiar las cubiertas en 5.000 km..." className="w-full rounded-lg border border-amber-200 bg-amber-50/30 p-4 focus:ring-2 focus:ring-amber-500 outline-none resize-none" />
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-all flex items-center gap-2">
                    {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Guardando y descontando stock...</> : <><CheckCircle size={20} /> Finalizar y Cerrar OT</>}
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