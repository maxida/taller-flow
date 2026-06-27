import { useState, useEffect } from 'react';
import { History, Search, Calendar, Car, FileText, AlertTriangle, CheckCircle, X, Wrench, Filter, Loader2, Camera, Printer, Share2, Package, Calculator } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config'; 
import logoImg from '../assets/logo.png'; 

const ZONAS_FOTOS_LABELS = {
  tablero: 'Tablero / Km',
  frente: 'Frente',
  trasera: 'Parte Trasera',
  izquierdo: 'Lat. Izquierdo',
  derecho: 'Lat. Derecho'
};

export default function Historial() {
  const [ots, setOts] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [filtroPatente, setFiltroPatente] = useState('');
  const [filtroOT, setFiltroOT] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroFechaCierre, setFiltroFechaCierre] = useState(''); 
  const [filtroEstado, setFiltroEstado] = useState('Todas'); 

  const [otSeleccionada, setOtSeleccionada] = useState(null);
  
  const [shareModal, setShareModal] = useState({ isOpen: false, method: 'whatsapp', contact: '+549' });

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const formatearMiles = (num) => Number(num).toLocaleString('es-AR');

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

  const handlePrint = () => {
    window.print();
  };

  const ejecutarCompartir = () => {
    const { contact } = shareModal;
    if (!contact.trim() || contact.trim() === '+549') {
      alert('Por favor ingresá el número de WhatsApp del cliente.');
      return;
    }

    const listaRepuestos = otSeleccionada.repuestosUtilizados?.length 
      ? otSeleccionada.repuestosUtilizados.map(r => `• ${r.cantidad}x ${r.nombre}`).join('\n')
      : '_Ninguno registrado_';

    const listaTrabajos = otSeleccionada.servicios?.map(s => `• ${s}`).join('\n') || '_Sin trabajos registrados_';

    const fechaIngreso = formatearFecha(otSeleccionada.fecha);
    const horaParte = otSeleccionada.horaIngreso ? ` a las ${otSeleccionada.horaIngreso} hs` : '';
    let bloqueFechas = `*Fecha de Ingreso:* ${fechaIngreso}${horaParte}`;
    
    let bloqueInforme = '';
    let bloqueFacturacion = '';

    if (otSeleccionada.estado === 'Cerrada') {
      if (otSeleccionada.fechaCierre) {
        const horaCierre = otSeleccionada.horaCierre ? ` a las ${otSeleccionada.horaCierre} hs` : '';
        bloqueFechas += `\n*Fecha de Cierre:* ${formatearFecha(otSeleccionada.fechaCierre)}${horaCierre}`;
      }

      bloqueInforme = `\n━━━━━━━━━━━━━━━━\n*INFORME TÉCNICO:*\n━━━━━━━━━━━━━━━━\n\n${otSeleccionada.informe || 'Sin informe detallado.'}\n\n━━━━━━━━━━━━━━━━\n*DIAGNÓSTICO / RECOMENDACIONES:*\n━━━━━━━━━━━━━━━━\n\n${otSeleccionada.diagnostico || 'Sin recomendaciones registradas.'}\n`;

      if (otSeleccionada.totalFinal !== undefined) {
        const subtotalRep = otSeleccionada.costoRepuestos || 0;
        const subtotalMO = otSeleccionada.costoManoObra || 0;
        const desc = otSeleccionada.descuento || 0;
        const montoDesc = ((subtotalRep + subtotalMO) * desc) / 100;

        bloqueFacturacion = `\n━━━━━━━━━━━━━━━━\n*RESUMEN DE FACTURACIÓN:*\n━━━━━━━━━━━━━━━━\n` +
          `• Repuestos: $${formatearMiles(subtotalRep)}\n` +
          `• Mano de Obra: $${formatearMiles(subtotalMO)}\n` +
          (desc > 0 ? `• Descuento (${desc}%): -$${formatearMiles(montoDesc)}\n` : '') +
          `*TOTAL FINAL: $${formatearMiles(otSeleccionada.totalFinal)}*\n`;
      }
    }

    const texto = `Hola, te enviamos el reporte de servicio técnico de *JOTA M.* 🔧\n\n` +
      `📍 R. Rojas 408, San Miguel de Tucumán\n📞 +54 9 3814 77-3368\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `*REPORTE DE SERVICIO*\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `*N° OT:* ${otSeleccionada.id_ot}\n` +
      `*Estado:* ${otSeleccionada.estado}\n\n` +
      `*Vehículo:* ${otSeleccionada.marca} ${otSeleccionada.modelo} (${otSeleccionada.anio})\n` +
      `*Patente:* ${otSeleccionada.patente}\n\n` +
      `${bloqueFechas}\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `*TRABAJOS REALIZADOS:*\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `${listaTrabajos}\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `*REPUESTOS UTILIZADOS:*\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `${listaRepuestos}\n` +
      `${bloqueInforme}` +
      `${bloqueFacturacion}\n` +
      `¡Gracias por confiar en nosotros! Quedamos a tu disposición. 🙌`;

    const url = `https://wa.me/${contact.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');

    setShareModal({ ...shareModal, isOpen: false });
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      
      {/* ENCABEZADO */}
      <div className="mb-6 lg:mb-8 print:hidden">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
          <History className="text-blue-600 w-7 h-7 sm:w-8 sm:h-8" />
          Historial de Vehículos
        </h2>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-500">Buscá y consultá el registro histórico de los trabajos.</p>
      </div>

      {/* BARRA DE FILTROS RESPONSIVA */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-6 lg:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 print:hidden">
        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Patente</label>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" value={filtroPatente} onChange={(e) => setFiltroPatente(e.target.value)} placeholder="Ej: AB123CD" className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase text-base sm:text-sm" />
          </div>
        </div>
        
        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">N° OT</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" value={filtroOT} onChange={(e) => setFiltroOT(e.target.value)} placeholder="Ej: OT-0001" className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none uppercase text-base sm:text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">F. Ingreso</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 text-base sm:text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">F. Cierre</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="date" value={filtroFechaCierre} onChange={(e) => setFiltroFechaCierre(e.target.value)} className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 text-base sm:text-sm" />
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Estado</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 text-base sm:text-sm bg-white appearance-none">
              <option value="Todas">Todas</option>
              <option value="Abierta">Abiertas</option>
              <option value="Cerrada">Cerradas</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 sm:py-20 bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center print:hidden">
          <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-slate-600">Cargando historial...</h3>
        </div>
      ) : otsFiltradas.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-white rounded-xl border border-dashed border-slate-300 print:hidden px-4">
          <History size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-slate-600">No se encontraron órdenes de trabajo</h3>
          <button onClick={() => { setFiltroPatente(''); setFiltroOT(''); setFiltroFecha(''); setFiltroFechaCierre(''); setFiltroEstado('Todas'); }} className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">Limpiar Filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 print:hidden">
          {otsFiltradas.map((ot) => (
            <div key={ot.firebaseId} onClick={() => setOtSeleccionada(ot)} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all p-4 sm:p-5 flex flex-col group">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{ot.patente}</h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">{ot.id_ot}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold block mb-1 ${ot.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{ot.estado}</span>
                  {ot.estado === 'Cerrada' && ot.totalFinal !== undefined && (
                    <span className="text-sm font-black text-blue-600 block mt-1.5">${formatearMiles(ot.totalFinal)}</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 sm:gap-2 bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 text-slate-600 text-[11px] sm:text-xs">
                  <Calendar size={14} className="text-blue-500 shrink-0" />
                  <span className="truncate"><span className="font-semibold">Ingreso:</span> {formatearFecha(ot.fecha)} {ot.horaIngreso ? `${ot.horaIngreso}` : ''}</span>
                </div>
                {ot.estado === 'Cerrada' && ot.fechaCierre && (
                  <div className="flex items-center gap-2 text-slate-600 text-[11px] sm:text-xs">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    <span className="truncate"><span className="font-semibold">Cierre:</span> {formatearFecha(ot.fechaCierre)} {ot.horaCierre ? `${ot.horaCierre}` : ''}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-3 border-t border-slate-100">
                <p className="font-semibold text-slate-700 text-sm truncate">{ot.marca} {ot.modelo}</p>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                  {ot.servicios?.length || 0} {(ot.servicios?.length || 0) === 1 ? 'trabajo' : 'trabajos'} • {ot.servicios?.[0] || 'Sin trabajos'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DETALLE DE OT (Diseño "Bottom Sheet" en Móvil, Modal centrado en PC) */}
      {otSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden">
          
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-300 relative overflow-hidden">
            
            {/* SUB-MODAL DE COMPARTIR */}
            {shareModal.isOpen && (
              <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 sm:p-6 w-full max-w-sm animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4 sm:mb-5 border-b border-slate-100 pb-3">
                    <h4 className="text-base sm:text-lg font-bold text-slate-800">Compartir Reporte</h4>
                    <button onClick={() => setShareModal({ ...shareModal, isOpen: false })} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"><X size={18}/></button>
                  </div>
                  
                  <div className="mb-5 sm:mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Número de WhatsApp</label>
                    <input 
                      type="tel" 
                      placeholder="Ej: 381 1234567"
                      value={shareModal.contact}
                      onChange={(e) => setShareModal({...shareModal, contact: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none bg-slate-50 text-base sm:text-sm"
                      autoFocus
                    />
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded border border-slate-200 leading-tight">
                      <strong className="text-slate-700">Info:</strong> Se enviará el resumen del servicio. El PDF requiere descarga manual.
                    </p>
                  </div>

                  <button onClick={ejecutarCompartir} className="w-full bg-slate-800 text-white font-bold py-3.5 sm:py-3 rounded-lg hover:bg-slate-900 transition-colors shadow-sm flex justify-center items-center gap-2 text-base sm:text-sm">
                    <Share2 size={18} /> Enviar por WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* CABECERA DEL MODAL */}
            <div className="flex justify-between items-start p-5 sm:p-6 border-b border-slate-100 shrink-0 bg-white">
              <div className="pr-4">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">{otSeleccionada.id_ot}</h3>
                <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">{otSeleccionada.patente} • {otSeleccionada.marca} {otSeleccionada.modelo}</p>
              </div>
              <button onClick={() => setOtSeleccionada(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shrink-0 text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* CONTENIDO DEL MODAL */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 bg-white custom-scrollbar">
              
              {/* BOTONES DE ACCIÓN MÓVILES/PC */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setShareModal({ isOpen: true, method: 'whatsapp', contact: '+549' })} className="w-full sm:flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-3 sm:py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm">
                  <Share2 size={18} /> Compartir Reporte
                </button>
                <button onClick={handlePrint} className="w-full sm:flex-1 flex justify-center items-center gap-2 bg-slate-100 text-slate-700 px-4 py-3 sm:py-2.5 rounded-lg font-semibold hover:bg-slate-200 transition-colors border border-slate-200 text-sm">
                  <Printer size={18} /> Imprimir PDF
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-100">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Ingreso</p>
                  <p className="text-slate-800 font-medium mt-1 text-sm sm:text-base">
                    {formatearFecha(otSeleccionada.fecha)}
                    {otSeleccionada.horaIngreso ? ` - ${otSeleccionada.horaIngreso} hs` : ''}
                  </p>
                </div>
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-100">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Estado y Cierre</p>
                  <p className={`font-bold mt-1 text-sm sm:text-base ${otSeleccionada.estado === 'Abierta' ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {otSeleccionada.estado}
                  </p>
                  {otSeleccionada.estado === 'Cerrada' && otSeleccionada.fechaCierre && (
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                      Finalizado: {formatearFecha(otSeleccionada.fechaCierre)} {otSeleccionada.horaCierre ? `${otSeleccionada.horaCierre}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {otSeleccionada.fotos && Object.keys(otSeleccionada.fotos).length > 0 && (
                <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-3 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <Camera size={16} className="text-blue-500" />
                    Estado Visual al Ingreso
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
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

              <div>
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm sm:text-base"><Wrench size={18} className="text-blue-500" /> Trabajos Solicitados</h4>
                <ul className="space-y-2">
                  {otSeleccionada.servicios?.map((srv, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600 text-[13px] sm:text-sm"><CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />{srv}</li>
                  ))}
                </ul>
              </div>

              {otSeleccionada.repuestosUtilizados && otSeleccionada.repuestosUtilizados.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Package size={18} className="text-blue-500" /> Repuestos Utilizados
                  </h4>
                  <ul className="space-y-2">
                    {otSeleccionada.repuestosUtilizados.map((rep, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2.5 sm:gap-3 text-slate-600 text-[13px] sm:text-sm min-w-0 pr-2">
                          <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[11px] sm:text-xs shrink-0">
                            {rep.cantidad}x
                          </span>
                          <span className="font-medium text-slate-700 truncate">{rep.nombre}</span>
                        </div>
                        {rep.subtotal !== undefined && (
                          <span className="text-[13px] sm:text-sm font-bold text-slate-500 shrink-0">${formatearMiles(rep.subtotal)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {otSeleccionada.estado === 'Cerrada' && (
                <>
                  <div className="bg-blue-50/50 p-4 sm:p-5 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base"><FileText size={18} className="text-blue-600" /> Informe del Mecánico</h4>
                    <p className="text-slate-700 text-[13px] sm:text-sm whitespace-pre-wrap leading-relaxed">{otSeleccionada.informe || 'No hay informe registrado.'}</p>
                  </div>
                  <div className="bg-amber-50/50 p-4 sm:p-5 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-sm sm:text-base"><AlertTriangle size={18} className="text-amber-500" /> Diagnóstico a Futuro</h4>
                    <p className="text-slate-700 text-[13px] sm:text-sm whitespace-pre-wrap leading-relaxed">{otSeleccionada.diagnostico || 'No hay diagnóstico registrado.'}</p>
                  </div>

                  {otSeleccionada.totalFinal !== undefined && (
                    <div className="bg-slate-800 p-4 sm:p-5 rounded-xl text-white shadow-md mt-4 sm:mt-6">
                      <h4 className="flex items-center gap-2 font-bold text-slate-200 mb-3 sm:mb-4 border-b border-slate-700 pb-2 sm:pb-3 text-sm sm:text-base">
                        <Calculator className="text-blue-400" size={18} /> Resumen de Facturación
                      </h4>
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="flex justify-between text-[13px] sm:text-sm text-slate-400">
                          <span>Costo Repuestos:</span>
                          <span className="font-medium text-slate-200">${formatearMiles(otSeleccionada.costoRepuestos || 0)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] sm:text-sm text-slate-400">
                          <span>Costo Mano de Obra:</span>
                          <span className="font-medium text-slate-200">${formatearMiles(otSeleccionada.costoManoObra || 0)}</span>
                        </div>
                        {otSeleccionada.descuento > 0 && (
                          <div className="flex justify-between text-[13px] sm:text-sm text-emerald-400">
                            <span>Descuento ({otSeleccionada.descuento}%):</span>
                            <span className="font-medium">-${formatearMiles(((otSeleccionada.costoRepuestos || 0) + (otSeleccionada.costoManoObra || 0)) * otSeleccionada.descuento / 100)}</span>
                          </div>
                        )}
                        <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-base sm:text-lg font-bold text-white">TOTAL COBRADO:</span>
                          <span className="text-xl sm:text-2xl font-black text-blue-400">${formatearMiles(otSeleccionada.totalFinal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA DE IMPRESIÓN PDF (Sin cambios, es exclusiva para PC) */}
      {/* ========================================================= */}
      {otSeleccionada && (
        <div id="zona-impresion" className="hidden print:flex flex-col bg-white w-full text-slate-800 p-8">
          <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <img src={logoImg} alt="Logo" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap">JOTA M.</h1>
                <p className="text-sm text-slate-500 font-medium">R. Rojas 408, T4002HHJ San Miguel de Tucumán, Tucumán</p>
                <p className="text-sm text-slate-500 font-medium">Tel: +54 9 3814 77-3368 | CUIT: 20-41125962-6 </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600 mb-1 uppercase tracking-widest leading-none">Reporte de Servicio</div>
              <p className="text-sm font-bold text-slate-800">{otSeleccionada.id_ot}</p>
              <p className="text-xs font-semibold text-slate-500">Estado: {otSeleccionada.estado}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vehículo / Cliente:</p>
              <p className="font-bold text-lg text-slate-800 leading-tight flex items-center gap-2">
                <Car size={16} className="text-slate-400" /> {otSeleccionada.marca} {otSeleccionada.modelo} ({otSeleccionada.anio})
              </p>
              <p className="text-sm text-slate-600 uppercase bg-white border border-slate-300 px-2 py-0.5 rounded inline-block mt-2 font-mono">{otSeleccionada.patente}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha de Ingreso:</p>
                <p className="text-sm font-semibold text-slate-800">{formatearFecha(otSeleccionada.fecha)} {otSeleccionada.horaIngreso && `a las ${otSeleccionada.horaIngreso} hs`}</p>
              </div>
              {otSeleccionada.estado === 'Cerrada' && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha de Cierre:</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatearFecha(otSeleccionada.fechaCierre)} {otSeleccionada.horaCierre && `a las ${otSeleccionada.horaCierre} hs`}</p>
                </div>
              )}
            </div>
          </div>

          {otSeleccionada.fotos && Object.keys(otSeleccionada.fotos).length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1 text-sm uppercase">Evidencia Visual al Ingreso</h4>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(otSeleccionada.fotos).map(([zona, url]) => (
                  <div key={zona} className="rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100 relative">
                    <img src={url} alt={zona} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-white/90 pt-1 pb-1 px-1">
                      <p className="text-slate-800 text-[9px] font-bold uppercase text-center">{ZONAS_FOTOS_LABELS[zona] || zona}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1 text-sm uppercase">Trabajos Realizados</h4>
              <ul className="space-y-1">
                {otSeleccionada.servicios?.map((srv, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-slate-700 text-xs">
                    <CheckCircle size={12} className="text-blue-500 mt-0.5 shrink-0" />
                    {srv}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1 text-sm uppercase">Repuestos Utilizados</h4>
              {otSeleccionada.repuestosUtilizados && otSeleccionada.repuestosUtilizados.length > 0 ? (
                <ul className="space-y-1">
                  {otSeleccionada.repuestosUtilizados.map((rep, idx) => (
                    <li key={idx} className="flex items-center justify-between text-slate-700 text-xs">
                      <span><span className="font-bold text-slate-500">{rep.cantidad}x</span> {rep.nombre}</span>
                      {rep.subtotal !== undefined && <span className="font-bold text-slate-500">${formatearMiles(rep.subtotal)}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">- No se registraron repuestos del taller -</p>
              )}
            </div>
          </div>

          {otSeleccionada.estado === 'Cerrada' && (
            <div className="space-y-4 flex-1">
              <div>
                <h4 className="font-bold text-slate-700 mb-1 text-sm uppercase">Informe Técnico</h4>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap min-h-[60px]">
                  {otSeleccionada.informe || 'Sin informe detallado.'}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-amber-700 mb-1 text-sm uppercase flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Diagnóstico a Futuro / Recomendaciones
                </h4>
                <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm text-amber-900 whitespace-pre-wrap min-h-[40px]">
                  {otSeleccionada.diagnostico || 'Sin recomendaciones registradas.'}
                </div>
              </div>

              {otSeleccionada.totalFinal !== undefined && (
                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                  <div className="w-64 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Repuestos:</span>
                      <span>${formatearMiles(otSeleccionada.costoRepuestos || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Mano de Obra:</span>
                      <span>${formatearMiles(otSeleccionada.costoManoObra || 0)}</span>
                    </div>
                    {otSeleccionada.descuento > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Descuento ({otSeleccionada.descuento}%):</span>
                        <span>-${formatearMiles(((otSeleccionada.costoRepuestos || 0) + (otSeleccionada.costoManoObra || 0)) * otSeleccionada.descuento / 100)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2 mt-2 border-t border-slate-300">
                      <span>TOTAL COBRADO:</span>
                      <span>${formatearMiles(otSeleccionada.totalFinal)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12 pt-8 flex justify-around items-start">
                <div className="text-center w-64">
                  <div className="border-t border-slate-800 mb-2"></div>
                  <p className="text-xs font-bold text-slate-700">Firma del Cliente</p>
                  <p className="text-[10px] text-slate-500">Recibí el vehículo conforme con los trabajos detallados</p>
                </div>
                <div className="text-center w-64">
                  <div className="border-t border-slate-800 mb-2"></div>
                  <p className="text-xs font-bold text-slate-700">Aclaración / DNI</p>
                  <p className="text-[10px] text-slate-500">Titular o persona autorizada para el retiro</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-slate-400 text-[10px]">
            Documento generado automáticamente por TallerFlow | JOTA M. Mecánica Integral
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { 
            margin: 15mm 20mm; 
            size: A4 portrait; 
          }
          body { 
            background-color: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          body * { visibility: hidden; }
          #zona-impresion, #zona-impresion * { visibility: visible; }
          #zona-impresion {
            position: absolute; left: 0; top: 0; width: 100vw !important;
            max-width: 100% !important; margin: 0 !important; padding: 0 !important;
            display: flex !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}