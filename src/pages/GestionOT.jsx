import { useState, useEffect } from 'react';
import { Search, Wrench, FileText, AlertTriangle, CheckCircle, Clock, ChevronRight, Loader2, Package, Plus, Minus, Trash2, Camera, DollarSign, Calculator, Percent, ArrowLeft } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, increment, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const ZONAS_FOTOS_LABELS = {
  tablero: 'Tablero / Km',
  frente: 'Frente',
  trasera: 'Parte Trasera',
  izquierdo: 'Lat. Izquierdo',
  derecho: 'Lat. Derecho'
};

export default function GestionOT() {
  const [searchTerm, setSearchTerm] = useState('');
  const [otsAbiertas, setOtsAbiertas] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [otSeleccionada, setOtSeleccionada] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [informe, setInforme] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  const [inventario, setInventario] = useState([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);
  const [busquedaRepuesto, setBusquedaRepuesto] = useState('');

  const [costoRepuestos, setCostoRepuestos] = useState(0);
  const [costoManoObra, setCostoManoObra] = useState(0);
  const [descuento, setDescuento] = useState(0);

  const formatearMiles = (num) => Number(num).toLocaleString('es-AR');
  const parsearMiles = (str) => Number(str.replace(/\./g, '').replace(/[^0-9]/g, '')) || 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qOTs = query(collection(db, "ordenes"), where("estado", "==", "Abierta"));
        const snapshotOTs = await getDocs(qOTs);
        const abiertas = snapshotOTs.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        setOtsAbiertas(abiertas);
        setResultados(abiertas);

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

  useEffect(() => {
    const sumaAutomatica = repuestosSeleccionados.reduce((acc, rep) => acc + (rep.cantidadUsada * (rep.precioUnitario || 0)), 0);
    if (sumaAutomatica > 0) {
      setCostoRepuestos(sumaAutomatica);
    } else if (repuestosSeleccionados.length === 0) {
      setCostoRepuestos(0);
    }
  }, [repuestosSeleccionados]);

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

  const seleccionarOT = (ot) => {
    setOtSeleccionada(ot);
    setInforme(ot.informe || '');
    setDiagnostico(ot.diagnostico || '');
    setRepuestosSeleccionados([]);
    setBusquedaRepuesto('');
    setCostoRepuestos(0);
    setCostoManoObra(0);
    setDescuento(0);
    // En móviles, al seleccionar, la vista cambia automáticamente gracias al renderizado condicional
  };

  const repuestosSugeridos = busquedaRepuesto.trim() === '' ? [] : inventario.filter(item => 
    item.nombre.toLowerCase().includes(busquedaRepuesto.toLowerCase()) && 
    !repuestosSeleccionados.find(r => r.id === item.id)
  ).slice(0, 5);

  const agregarRepuesto = (item) => {
    if (item.stock <= 0) {
      alert("¡No hay stock de este repuesto!");
      return;
    }
    setRepuestosSeleccionados([...repuestosSeleccionados, { ...item, cantidadUsada: 1, precioUnitario: 0 }]);
    setBusquedaRepuesto(''); 
  };

  const modificarCantidadRepuesto = (id, delta) => {
    setRepuestosSeleccionados(prev => prev.map(rep => {
      if (rep.id === id) {
        const nuevaCantidad = rep.cantidadUsada + delta;
        if (nuevaCantidad > 0 && nuevaCantidad <= rep.stock) {
          return { ...rep, cantidadUsada: nuevaCantidad };
        }
      }
      return rep;
    }));
  };

  const modificarPrecioRepuesto = (id, precio) => {
    setRepuestosSeleccionados(prev => prev.map(rep => rep.id === id ? { ...rep, precioUnitario: precio } : rep));
  };

  const eliminarRepuesto = (id) => {
    setRepuestosSeleccionados(repuestosSeleccionados.filter(rep => rep.id !== id));
  };

  const subtotalOT = costoRepuestos + costoManoObra;
  const montoDescuento = (subtotalOT * descuento) / 100;
  const totalFinal = subtotalOT - montoDescuento;

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

      const updateInventarioPromises = repuestosSeleccionados.map(rep => {
        const repRef = doc(db, "inventario", rep.id);
        return updateDoc(repRef, { stock: increment(-rep.cantidadUsada) });
      });
      await Promise.all(updateInventarioPromises);

      const otRef = doc(db, "ordenes", otSeleccionada.firebaseId);
      
      const repuestosGuardar = repuestosSeleccionados.map(r => ({
        id: r.id,
        nombre: r.nombre,
        cantidad: r.cantidadUsada,
        precioUnitario: r.precioUnitario || 0,
        subtotal: r.cantidadUsada * (r.precioUnitario || 0)
      }));

      await updateDoc(otRef, {
        estado: 'Cerrada',
        informe: informe,
        diagnostico: diagnostico,
        repuestosUtilizados: repuestosGuardar,
        fechaCierre: fechaCierre,
        horaCierre: horaCierre,
        costoManoObra: costoManoObra,
        costoRepuestos: costoRepuestos,
        descuento: descuento,
        totalFinal: totalFinal
      });

      alert(`¡La ${otSeleccionada.id_ot} fue cerrada con éxito y los costos fueron registrados!`);
      
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

      // Al setear a null, en móviles vuelve a mostrar automáticamente la lista
      setOtSeleccionada(null);

    } catch (error) {
      console.error("Error al cerrar la OT:", error);
      alert("Hubo un error al procesar el cierre. Revisá la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // En Desktop toma altura fija con scroll interno. En Móvil toma altura auto con padding extra para el botón flotante.
    <div className="max-w-7xl mx-auto flex flex-col lg:h-[calc(100dvh-6rem)] pb-24 lg:pb-0">
      
      {/* Título: Solo se muestra si no hay OT seleccionada o si estamos en Desktop */}
      <div className={`mb-6 ${otSeleccionada ? 'hidden lg:block' : 'block'}`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
          <Wrench className="text-blue-600 w-7 h-7 sm:w-8 sm:h-8" />
          Gestión de Órdenes
        </h2>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-500">Cargá repuestos, costos y cerrá la OT.</p>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 min-h-0">
        
        {/* ==================================================== */}
        {/* COLUMNA IZQUIERDA: Buscador y Lista de OT */}
        {/* En móvil, se OCULTA si hay una OT seleccionada */}
        {/* ==================================================== */}
        <div className={`${otSeleccionada ? 'hidden lg:flex' : 'flex'} flex-col bg-white rounded-xl shadow-sm border border-slate-200 h-full lg:overflow-hidden`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={handleSearch} 
                placeholder="Buscar patente o N°..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase text-base sm:text-sm" 
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center h-48 lg:h-full text-slate-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p className="text-sm">Cargando...</p>
              </div>
            ) : resultados.length === 0 ? (
              <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
                <CheckCircle size={40} className="mb-2 opacity-50 text-emerald-500" />
                <p className="text-slate-600 font-medium text-sm">No hay vehículos pendientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resultados.map(ot => (
                  <button 
                    key={ot.firebaseId} 
                    onClick={() => seleccionarOT(ot)} 
                    className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between ${otSeleccionada?.firebaseId === ot.firebaseId ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 text-base">{ot.patente}</span>
                        <span className="text-xs text-slate-500 shrink-0">• {ot.id_ot}</span>
                      </div>
                      <div className="text-sm text-slate-600 truncate">{ot.marca} {ot.modelo}</div>
                    </div>
                    <ChevronRight size={18} className={`shrink-0 ${otSeleccionada?.firebaseId === ot.firebaseId ? 'text-blue-600' : 'text-slate-400'}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* COLUMNA DERECHA: Detalle, Repuestos y Cierre */}
        {/* En móvil, se OCULTA si NO hay una OT seleccionada */}
        {/* ==================================================== */}
        <div className={`${!otSeleccionada ? 'hidden lg:flex' : 'flex'} flex-col lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 h-full lg:overflow-y-auto relative`}>
          {!otSeleccionada ? (
            <div className="hidden lg:flex h-full flex-col items-center justify-center text-slate-400 p-8 text-center">
              <FileText size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-slate-600">Ninguna OT seleccionada</h3>
              <p className="mt-2 text-sm">Seleccioná un vehículo de la lista para ver los detalles y cerrar la orden.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 lg:p-8">
              
              {/* Botón Volver (Solo visible en Móviles) */}
              <button 
                onClick={() => setOtSeleccionada(null)}
                className="lg:hidden flex items-center gap-2 text-blue-600 font-medium mb-4 hover:underline focus:outline-none"
              >
                <ArrowLeft size={18} /> Volver al listado
              </button>

              {/* Encabezado Responsivo */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{otSeleccionada.id_ot}</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-slate-600">
                    <span className="flex items-center gap-1 text-sm"><Clock size={16} /> {otSeleccionada.fecha} {otSeleccionada.horaIngreso ? `${otSeleccionada.horaIngreso}` : ''}</span>
                    <span className="px-2 py-0.5 rounded text-xs sm:text-sm font-semibold bg-emerald-100 text-emerald-700">{otSeleccionada.estado}</span>
                  </div>
                </div>
                <div className="sm:text-right bg-slate-50 p-3 sm:bg-transparent sm:p-0 rounded-lg w-full sm:w-auto border border-slate-100 sm:border-none">
                  <div className="text-lg sm:text-xl font-bold text-slate-800 tracking-wide">{otSeleccionada.patente}</div>
                  <div className="text-sm text-slate-600">{otSeleccionada.marca} {otSeleccionada.modelo} ({otSeleccionada.anio})</div>
                </div>
              </div>

              {/* FOTOS */}
              {otSeleccionada.fotos && Object.keys(otSeleccionada.fotos).length > 0 && (
                <div className="mb-6 lg:mb-8 bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-3 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <Camera size={16} className="text-blue-500" /> Estado Visual al Ingreso
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
                    {Object.entries(otSeleccionada.fotos).map(([zona, url]) => (
                      <a key={zona} href={url} target="_blank" rel="noopener noreferrer" className="group relative rounded-lg overflow-hidden border border-slate-200 h-20 sm:h-24 bg-white block hover:ring-2 hover:ring-blue-500 transition-all shadow-sm" title="Haz clic para ampliar">
                        <img src={url} alt={zona} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent pt-6 pb-1 sm:pb-1.5 px-1">
                          <p className="text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center truncate shadow-sm">{ZONAS_FOTOS_LABELS[zona] || zona}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Trabajos del Check-In */}
              <div className="mb-6 lg:mb-8">
                <h4 className="font-semibold text-slate-700 mb-3 text-xs sm:text-sm uppercase tracking-wider">Trabajos Solicitados (Check-in)</h4>
                <div className="flex flex-wrap gap-2">
                  {otSeleccionada.servicios?.map(srv => (
                    <span key={srv} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-[13px] sm:text-sm flex items-center gap-2">
                      <CheckCircle size={14} className="text-blue-500 shrink-0" /> {srv}
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleFinalizar} className="space-y-6 lg:space-y-8">
                
                {/* SECCIÓN DE REPUESTOS CON PRECIOS */}
                <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 text-sm sm:text-base">
                    <Package className="text-blue-600" size={18} /> Repuestos Utilizados y Precios
                  </h4>
                  
                  <div className="relative mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={busquedaRepuesto} 
                        onChange={(e) => setBusquedaRepuesto(e.target.value)} 
                        placeholder="Buscar repuesto..." 
                        className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none bg-white text-base sm:text-sm"
                      />
                    </div>

                    {repuestosSugeridos.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                        {repuestosSugeridos.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => agregarRepuesto(item)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 flex justify-between items-center transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-slate-800 text-sm truncate">{item.nombre}</p>
                              <p className="text-xs text-slate-500 truncate">{item.categoria} • {item.compatibilidad}</p>
                            </div>
                            <span className={`text-xs sm:text-sm font-bold shrink-0 ${item.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              Stock: {item.stock}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {repuestosSeleccionados.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                      {repuestosSeleccionados.map((rep) => (
                        <div key={rep.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-slate-50 gap-3 sm:gap-4">
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-700 text-sm truncate">{rep.nombre}</p>
                            <p className="text-xs text-slate-400">Stock disp: {rep.stock}</p>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                              <input 
                                type="text"
                                value={rep.precioUnitario === 0 ? '' : formatearMiles(rep.precioUnitario)}
                                onChange={(e) => modificarPrecioRepuesto(rep.id, parsearMiles(e.target.value))}
                                className="w-24 sm:w-28 pl-7 pr-3 py-2 sm:py-1.5 text-right rounded-md border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-slate-50"
                                placeholder="Precio"
                              />
                            </div>

                            <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 shrink-0">
                              <button type="button" onClick={() => modificarCantidadRepuesto(rep.id, -1)} className="p-2 sm:p-1.5 text-slate-500 hover:text-slate-800"><Minus size={16}/></button>
                              <span className="w-6 sm:w-8 text-center font-bold text-sm text-slate-800">{rep.cantidadUsada}</span>
                              <button type="button" onClick={() => modificarCantidadRepuesto(rep.id, 1)} disabled={rep.cantidadUsada >= rep.stock} className="p-2 sm:p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30"><Plus size={16}/></button>
                            </div>
                            <button type="button" onClick={() => eliminarRepuesto(rep.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Informe y Diagnóstico */}
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2"><FileText size={16} className="text-blue-600" /> Informe General</label>
                    <textarea value={informe} onChange={(e) => setInforme(e.target.value)} required rows={4} placeholder="Detalle los trabajos realizados..." className="w-full rounded-lg border border-slate-300 p-3 sm:p-4 focus:ring-2 focus:ring-blue-600 outline-none resize-none text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2"><AlertTriangle size={16} className="text-amber-500" /> Diagnóstico a Futuro</label>
                    <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} required rows={3} placeholder="Ej: Se recomienda cambiar cubiertas en 5.000 km..." className="w-full rounded-lg border border-amber-200 bg-amber-50/30 p-3 sm:p-4 focus:ring-2 focus:ring-amber-500 outline-none resize-none text-base sm:text-sm" />
                  </div>
                </div>

                {/* RESUMEN FINANCIERO */}
                <div className="bg-slate-800 rounded-xl p-4 sm:p-6 text-white shadow-md">
                  <h4 className="flex items-center gap-2 font-bold text-slate-200 mb-4 sm:mb-6 border-b border-slate-700 pb-3 text-sm sm:text-base">
                    <Calculator className="text-blue-400" size={18} /> Resumen de Facturación
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                    <div>
                      <label className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Repuestos ($)</label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={costoRepuestos === 0 ? '' : formatearMiles(costoRepuestos)}
                          onChange={(e) => setCostoRepuestos(parsearMiles(e.target.value))}
                          className="w-full pl-9 pr-3 py-2.5 sm:py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-colors text-base sm:text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Mano Obra ($)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={costoManoObra === 0 ? '' : formatearMiles(costoManoObra)}
                          onChange={(e) => setCostoManoObra(parsearMiles(e.target.value))}
                          className="w-full pl-9 pr-3 py-2.5 sm:py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-colors text-base sm:text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Descuento (%)</label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="number" 
                          min="0" max="100"
                          value={descuento === 0 ? '' : descuento}
                          onChange={(e) => setDescuento(Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2.5 sm:py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-colors text-base sm:text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 sm:p-5 space-y-2 sm:space-y-3">
                    <div className="flex justify-between text-xs sm:text-sm text-slate-400">
                      <span>Subtotal Repuestos:</span>
                      <span className="font-medium text-slate-200">${formatearMiles(costoRepuestos)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-slate-400">
                      <span>Subtotal Mano Obra:</span>
                      <span className="font-medium text-slate-200">${formatearMiles(costoManoObra)}</span>
                    </div>
                    {descuento > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm text-emerald-400">
                        <span>Descuento ({descuento}%):</span>
                        <span className="font-medium">-${formatearMiles(montoDescuento)}</span>
                      </div>
                    )}
                    <div className="pt-3 mt-3 border-t border-slate-700 flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold text-white">TOTAL:</span>
                      <span className="text-xl sm:text-2xl font-black text-blue-400">${formatearMiles(totalFinal)}</span>
                    </div>
                  </div>
                </div>

                {/* BOTÓN FLOTANTE EN MÓVIL / NORMAL EN DESKTOP */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:relative lg:p-0 lg:bg-transparent lg:border-none lg:shadow-none lg:backdrop-blur-none z-30 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3.5 sm:py-3 px-6 sm:px-8 rounded-xl lg:rounded-lg shadow-md lg:shadow-sm transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Guardando...</> : <><CheckCircle size={20} /> Cerrar OT</>}
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