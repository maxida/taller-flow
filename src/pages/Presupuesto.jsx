import { useState } from 'react';
import { Calculator, Printer, MessageCircle, Mail, Plus, Trash2, Car, User, CheckCircle, Wrench } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Presupuesto() {
  const [cliente, setCliente] = useState({ nombre: '', vehiculo: '', patente: '', telefono: '+549' });
  const [descuento, setDescuento] = useState(0);
  const [items, setItems] = useState([
    { id: Date.now(), descripcion: '', cantidad: 1, precioUnitario: 0, tipo: 'Mano de Obra' }
  ]);

  const formatearMiles = (num) => Number(num).toLocaleString('es-AR');
  const parsearMiles = (str) => Number(str.replace(/\./g, '').replace(/[^0-9]/g, '')) || 0;

  const fechaActual = new Date().toLocaleDateString('es-AR');
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);
  const fechaVencimientoStr = fechaVencimiento.toLocaleDateString('es-AR');

  const handleClienteChange = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

  const agregarItem = () => {
    setItems([...items, { id: Date.now(), descripcion: '', cantidad: 1, precioUnitario: 0, tipo: 'Mano de Obra' }]);
  };

  const actualizarItem = (id, campo, valor) => {
    setItems(items.map(item => item.id === id ? { ...item, [campo]: valor } : item));
  };

  const eliminarItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => {
    if (item.tipo === 'Repuesto (Trae Cliente)') return acc;
    return acc + (Number(item.cantidad) * Number(item.precioUnitario));
  }, 0);

  const montoDescuento = (subtotal * Number(descuento)) / 100;
  const total = subtotal - montoDescuento;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!cliente.telefono) {
      alert("Por favor, ingresá el teléfono del cliente para enviar el WhatsApp.");
      return;
    }
    const texto = `Hola ${cliente.nombre || 'amigo/a'}, te envío el presupuesto para tu ${cliente.vehiculo || 'vehículo'} desde *JOTA M.*.\n\n*Total estimado:* $${total.toLocaleString('es-AR')}\n\nQuedamos a tu disposición. ¡Un saludo!`;
    const url = `https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const texto = `Hola ${cliente.nombre},\n\nAdjunto el presupuesto para los trabajos en tu ${cliente.vehiculo}.\n\nTotal estimado: $${total.toLocaleString('es-AR')}\n\nSaludos,\n JOTA M..`;
    window.location.href = `mailto:?subject=Presupuesto JOTA M. - ${cliente.vehiculo}&body=${encodeURIComponent(texto)}`;
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-6 print:hidden">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Calculator className="text-blue-600" size={32} />
          Generador de Presupuestos
        </h2>
        <p className="mt-2 text-slate-500">Armá la cotización, imprimí el PDF o envialo directo al cliente.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 print:block print:w-full">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <div className="xl:w-5/12 space-y-6 print:hidden">
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2"><User size={18} className="text-blue-500"/> Datos del Cliente</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre / Razón Social</label>
                <input type="text" name="nombre" value={cliente.nombre} onChange={handleClienteChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono (WhatsApp)</label>
                <input type="text" name="telefono" value={cliente.telefono} onChange={handleClienteChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ej: 381 1234567" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vehículo</label>
                  <input type="text" name="vehiculo" value={cliente.vehiculo} onChange={handleClienteChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ej: VW Gol Trend" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Patente</label>
                  <input type="text" name="patente" value={cliente.patente} onChange={handleClienteChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase" placeholder="Ej: AB123CD" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2"><Wrench size={18} className="text-blue-500"/> Detalle del Trabajo</h3>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                  <button onClick={() => eliminarItem(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm"><Trash2 size={14}/></button>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12">
                      <input type="text" value={item.descripcion} onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Descripción del trabajo o repuesto" />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <select value={item.tipo} onChange={(e) => actualizarItem(item.id, 'tipo', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option value="Mano de Obra">Mano de Obra</option>
                        <option value="Repuesto (Taller)">Repuesto (Pone el Taller)</option>
                        <option value="Repuesto (Trae Cliente)">Repuesto (Trae el Cliente)</option>
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <input type="number" min="1" value={item.cantidad} onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center" placeholder="Cant." />
                    </div>
                    <div className="col-span-6 md:col-span-4">
                      <input type="text" disabled={item.tipo === 'Repuesto (Trae Cliente)'} value={item.tipo === 'Repuesto (Trae Cliente)' ? '0' : formatearMiles(item.precioUnitario)} onChange={(e) => actualizarItem(item.id, 'precioUnitario', parsearMiles(e.target.value))} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right disabled:bg-slate-100 disabled:text-slate-400" placeholder="$ P. Unitario" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={agregarItem} className="w-full py-2.5 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                <Plus size={16} /> Agregar Ítem
              </button>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end items-center gap-3">
              <label className="text-sm font-medium text-slate-600">Descuento Global (%)</label>
              <input type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(e.target.value)} className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-center" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={handlePrint} className="col-span-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all">
              <Printer size={18} /> Exportar PDF / Imprimir
            </button>
            <button onClick={handleWhatsApp} className="col-span-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all">
              <MessageCircle size={18} /> Enviar WhatsApp
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: VISTA PREVIA HOJA A4 */}
        <div className="xl:w-7/12 w-full print:w-full print:m-0 print:p-0">
          <div id="zona-impresion" className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 text-slate-800 flex flex-col print:shadow-none print:border-none print:w-full print:max-w-none print:p-8">
            
            {/* Cabecera */}
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <img src={logoImg} alt="Logo" className="w-14 h-14 object-contain print:w-16 print:h-16" />
                <div>
                  <h1 className="text-2xl print:text-3xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap">JOTA M.</h1>
                  <p className="text-sm print:text-sm text-slate-500 font-medium">R. Rojas 408, T4002HHJ San Miguel de Tucumán, Tucumán</p>
                  <p className="text-sm print:text-sm text-slate-500 font-medium">Tel: +54 9 3814 77-3368 | CUIT: 20-12345678-9</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl print:text-2xl font-bold text-slate-300 mb-1 uppercase tracking-widest leading-none">Presupuesto</div>
                <p className="text-sm print:text-sm font-semibold"><span className="text-slate-500">Fecha:</span> {fechaActual}</p>
                <p className="text-sm print:text-sm font-semibold"><span className="text-slate-500">Válido hasta:</span> {fechaVencimientoStr}</p>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-slate-50 rounded-lg p-4 print:p-4 mb-6 border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs print:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Presupuestado a:</p>
                <p className="font-bold text-lg print:text-lg text-slate-800 leading-tight">{cliente.nombre || 'Consumidor Final'}</p>
                {cliente.telefono && <p className="text-sm print:text-sm text-slate-600 mt-1">Tel: {cliente.telefono}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs print:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vehículo:</p>
                <p className="font-bold text-lg print:text-lg text-slate-800 flex items-center gap-2 justify-end leading-tight">
                  <Car size={16} className="text-slate-400"/> {cliente.vehiculo || 'No especificado'}
                </p>
                {cliente.patente && <p className="text-xs print:text-xs text-slate-600 uppercase bg-white border border-slate-300 px-2 py-0.5 rounded inline-block mt-1 font-mono">{cliente.patente}</p>}
              </div>
            </div>

            {/* Tabla de Items */}
            <div className="flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-600">
                    <th className="py-3 px-2 text-sm print:text-sm font-bold">Descripción</th>
                    <th className="py-3 px-2 text-sm print:text-sm font-bold text-center w-32">Tipo</th>
                    <th className="py-3 px-2 text-sm print:text-sm font-bold text-center w-16">Cant.</th>
                    <th className="py-3 px-2 text-sm print:text-sm font-bold text-right w-28">P. Unit</th>
                    <th className="py-3 px-2 text-sm print:text-sm font-bold text-right w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-sm print:text-sm">
                  {items.map((item, idx) => {
                    const isClientPart = item.tipo === 'Repuesto (Trae Cliente)';
                    const itemTotal = isClientPart ? 0 : Number(item.cantidad) * Number(item.precioUnitario);
                    
                    return (
                      <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="py-3 px-2 font-medium text-slate-800">{item.descripcion || '-'}</td>
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full font-semibold text-xs print:text-xs print:border print:bg-transparent ${item.tipo === 'Mano de Obra' ? 'bg-blue-100 text-blue-700 print:border-blue-400 print:text-blue-700' : isClientPart ? 'bg-amber-100 text-amber-700 print:border-amber-400 print:text-amber-700' : 'bg-emerald-100 text-emerald-700 print:border-emerald-400 print:text-emerald-700'}`}>
                            {item.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-600 font-medium">{item.cantidad}</td>
                        <td className="py-3 px-2 text-right text-slate-600 font-medium">
                          {isClientPart ? '-' : `$${Number(item.precioUnitario).toLocaleString('es-AR')}`}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-slate-800">
                          {isClientPart ? 'Provisto' : `$${itemTotal.toLocaleString('es-AR')}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="mt-6 border-t-2 border-slate-800 pt-4 flex justify-end">
              <div className="w-64 print:w-64 space-y-2">
                <div className="flex justify-between text-slate-600 font-medium text-sm print:text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                {Number(descuento) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium text-sm print:text-sm">
                    <span>Descuento ({descuento}%):</span>
                    <span>-$ {montoDescuento.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl print:text-2xl font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span>${total.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            {/* Pie de Página / Legales */}
            <div className="mt-12 pt-4 border-t border-slate-200 flex items-start gap-2 text-slate-500 text-xs print:text-xs leading-relaxed">
              <CheckCircle size={16} className="text-blue-500 shrink-0 mt-0.5 print:text-slate-400" />
              <p>
                <strong className="text-slate-700">Condiciones comerciales:</strong> Este presupuesto es válido por 15 días corridos a partir de la fecha de emisión ({fechaActual}). 
                Los valores expresados están sujetos a modificaciones imprevistas en los precios de los repuestos por parte de los proveedores. 
                Los repuestos provistos por el cliente no cuentan con garantía del taller ante fallas de fábrica.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ESTILOS DE IMPRESIÓN MEJORADOS */}
      <style>{`
        @media print {
          @page { 
            margin: 15mm 20mm; /* Márgenes perfectos para impresora */
            size: A4 portrait; 
          }
          body { 
            background-color: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          
          /* Oculta toda la app */
          body * {
            visibility: hidden;
          }
          
          /* Muestra SOLO la zona de impresión */
          #zona-impresion, #zona-impresion * {
            visibility: visible;
          }
          
          /* Posiciona la zona de impresión ocupando todo el ancho disponible */
          #zona-impresion {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}