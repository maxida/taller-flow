import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, CheckCircle, Loader2, X, Minus, AlertTriangle } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

// CATÁLOGO BASE
const INVENTARIO_BASE = [
  { nombre: 'Aceite Sintético 5W40', categoria: 'Fluidos', compatibilidad: 'Universal', stock: 0 },
  { nombre: 'Aceite Semisintético 10W40', categoria: 'Fluidos', compatibilidad: 'Universal', stock: 0 },
  { nombre: 'Líquido Refrigerante Rosa', categoria: 'Fluidos', compatibilidad: 'Universal', stock: 0 },
  { nombre: 'Líquido de Frenos DOT 4', categoria: 'Fluidos', compatibilidad: 'Universal', stock: 0 },
  { nombre: 'Batería 12x65 Moura', categoria: 'Electricidad', compatibilidad: 'Vehículos Medianos', stock: 0 },
  { nombre: 'Batería 12x75 Moura', categoria: 'Electricidad', compatibilidad: 'Camionetas/Diésel', stock: 0 },
  { nombre: 'Filtro de Aceite (Cartucho)', categoria: 'Filtros', compatibilidad: 'VW / Ford / Fiat', stock: 0 },
  { nombre: 'Filtro de Aire', categoria: 'Filtros', compatibilidad: 'Varios', stock: 0 },
  { nombre: 'Filtro de Habitáculo', categoria: 'Filtros', compatibilidad: 'Varios', stock: 0 },
  { nombre: 'Pastillas de Freno (Juego)', categoria: 'Frenos', compatibilidad: 'VW Gol / Trend / Voyage', stock: 0 },
  { nombre: 'Discos de Freno Ventilados', categoria: 'Frenos', compatibilidad: 'Específico por Modelo', stock: 0 },
  { nombre: 'Bujías (Juego x4)', categoria: 'Motor', compatibilidad: 'Universal Nafta', stock: 0 },
  { nombre: 'Bieletas', categoria: 'Suspensión', compatibilidad: 'Peugeot / Citroen', stock: 0 },
  { nombre: 'Rótula de Suspensión', categoria: 'Suspensión', compatibilidad: 'Universal', stock: 0 },
];

export default function Inventario() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', categoria: 'Filtros', compatibilidad: '', stock: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventario = async () => {
    try {
      const q = query(collection(db, "inventario"), orderBy("nombre", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      setItems(data);
    } catch (error) {
      console.error("Error al traer inventario: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventario();
  }, []);

  const handleCargarInventarioBase = async () => {
    setIsLoading(true);
    try {
      const promesas = INVENTARIO_BASE.map(item => addDoc(collection(db, "inventario"), item));
      await Promise.all(promesas);
      await fetchInventario();
      alert("¡Inventario base cargado con éxito!");
    } catch (error) {
      console.error("Error al inyectar datos: ", error);
    }
  };

  const handleAjusteRapido = async (id, stockActual, cantidadSumar) => {
    const nuevoStock = stockActual + cantidadSumar;
    if (nuevoStock < 0) return; 

    try {
      setItems(items.map(item => item.id === id ? { ...item, stock: nuevoStock } : item)); 
      await updateDoc(doc(db, "inventario", id), { stock: nuevoStock });
    } catch (error) {
      console.error("Error al actualizar stock: ", error);
      fetchInventario(); 
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (itemEditando) {
        await updateDoc(doc(db, "inventario", itemEditando.id), {
          ...formData,
          stock: Number(formData.stock)
        });
      } else {
        await addDoc(collection(db, "inventario"), {
          ...formData,
          stock: Number(formData.stock)
        });
      }
      setIsModalOpen(false);
      fetchInventario();
    } catch (error) {
      console.error("Error guardando item: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que querés eliminar este repuesto del inventario?")) {
      try {
        await deleteDoc(doc(db, "inventario", id));
        setItems(items.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error eliminando: ", error);
      }
    }
  };

  const abrirModalParaNuevo = () => {
    setItemEditando(null);
    setFormData({ nombre: '', categoria: 'Filtros', compatibilidad: '', stock: 0 });
    setIsModalOpen(true);
  };

  const abrirModalParaEditar = (item) => {
    setItemEditando(item);
    setFormData({ nombre: item.nombre, categoria: item.categoria, compatibilidad: item.compatibilidad, stock: item.stock });
    setIsModalOpen(true);
  };

  const filtrados = items.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex flex-col justify-center items-center h-[60vh] text-blue-600"><Loader2 className="animate-spin mb-4" size={48} /><p className="text-slate-500 font-medium">Cargando inventario...</p></div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-10 relative">
      
      {/* ENCABEZADO RESPONSIVO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 lg:mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
            <Package className="text-blue-600 w-7 h-7 sm:w-8 sm:h-8" /> Control de Inventario
          </h2>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-500">Administrá el stock de repuestos e insumos.</p>
        </div>
        <button onClick={abrirModalParaNuevo} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-2.5 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors">
          <Plus size={20} /> Nuevo Repuesto
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 px-4 text-center shadow-sm">
          <Package size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-2">El inventario está vacío</h3>
          <p className="text-sm sm:text-base text-slate-500 mb-6 max-w-md mx-auto">No hay ningún repuesto cargado. Podés agregar uno manualmente o cargar un listado base predeterminado.</p>
          <button onClick={handleCargarInventarioBase} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-md inline-flex justify-center items-center gap-2 transition-colors">
            <CheckCircle size={20} /> Generar Inventario Base
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* BARRA DE BÚSQUEDA */}
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar repuesto o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-base sm:text-sm"
              />
            </div>
          </div>

          {/* TABLA DE INVENTARIO (RESPONSIVA CON TARJETAS EN MÓVIL) */}
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse block md:table">
              
              {/* Cabecera: Oculta en móviles */}
              <thead className="hidden md:table-header-group">
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 w-1/3">Artículo</th>
                  <th className="p-4 w-1/6">Categoría</th>
                  <th className="p-4 w-1/4">Compatibilidad</th>
                  <th className="p-4 text-center w-1/6">Stock Actual</th>
                  <th className="p-4 text-right w-1/6">Acciones</th>
                </tr>
              </thead>
              
              <tbody className="block md:table-row-group divide-y divide-slate-100">
                {filtrados.map((item) => (
                  <tr key={item.id} className="block md:table-row hover:bg-slate-50 transition-colors bg-white md:bg-transparent border-b md:border-none border-slate-200 mb-2 md:mb-0">
                    
                    {/* Celda Artículo */}
                    <td className="block md:table-cell p-4 md:p-4">
                      <div className="flex flex-col md:block">
                        <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Artículo</span>
                        <span className="font-semibold text-slate-800 text-base md:text-sm">{item.nombre}</span>
                        {/* En móvil, mostramos la categoría debajo del título */}
                        <span className="md:hidden mt-2 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs text-slate-600 w-fit">{item.categoria}</span>
                      </div>
                    </td>

                    {/* Celda Categoría (Oculta en móvil porque se unió con el artículo) */}
                    <td className="hidden md:table-cell p-4">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-xs text-slate-600 whitespace-nowrap">{item.categoria}</span>
                    </td>

                    {/* Celda Compatibilidad */}
                    <td className="block md:table-cell px-4 py-2 md:p-4 text-sm">
                      <div className="flex items-center md:block justify-between">
                        <span className="md:hidden text-[11px] font-bold text-slate-400 uppercase">Apto para:</span>
                        <span className="text-slate-600 truncate md:max-w-[200px]">{item.compatibilidad || 'Universal'}</span>
                      </div>
                    </td>
                    
                    {/* Celda Stock y Controles */}
                    <td className="block md:table-cell px-4 py-3 md:p-4 bg-slate-50 md:bg-transparent mt-2 md:mt-0">
                      <div className="flex items-center justify-between md:justify-center">
                        <span className="md:hidden text-[11px] font-bold text-slate-400 uppercase">Stock:</span>
                        <div className="flex items-center gap-3 md:gap-2 lg:gap-3 bg-white md:bg-transparent p-1 md:p-0 rounded-lg border md:border-none border-slate-200">
                          <button onClick={() => handleAjusteRapido(item.id, item.stock, -1)} disabled={item.stock === 0} className="p-2 md:p-1 rounded-full text-slate-500 hover:bg-slate-200 disabled:opacity-30">
                            <Minus size={16} />
                          </button>
                          <span className={`text-lg font-black w-8 text-center ${item.stock === 0 ? 'text-red-500' : 'text-slate-800'}`}>
                            {item.stock}
                          </span>
                          <button onClick={() => handleAjusteRapido(item.id, item.stock, 1)} className="p-2 md:p-1 rounded-full text-slate-500 hover:bg-emerald-100 hover:text-emerald-700">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Celda Acciones */}
                    <td className="block md:table-cell p-4 text-right border-t md:border-none border-slate-100">
                      <div className="flex justify-end gap-2 md:gap-0">
                        <button onClick={() => abrirModalParaEditar(item)} className="p-2.5 md:p-2 bg-slate-100 md:bg-transparent text-slate-500 hover:text-blue-600 rounded-lg md:rounded-full transition-colors" title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleEliminar(item.id)} className="p-2.5 md:p-2 bg-red-50 md:bg-transparent text-red-400 hover:text-red-600 rounded-lg md:rounded-full transition-colors ml-2 md:ml-1" title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtrados.length === 0 && (
                  <tr className="block md:table-row">
                    <td colSpan="5" className="block md:table-cell p-8 text-center text-slate-500 text-sm">
                      No se encontraron repuestos con "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR / EDITAR (RESPONSIVO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                {itemEditando ? 'Editar Repuesto' : 'Nuevo Repuesto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full"><X size={18} className="text-slate-600" /></button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6 custom-scrollbar">
              <form onSubmit={handleGuardar} className="space-y-5 sm:space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Nombre del Artículo *</label>
                  <input 
                    type="text" 
                    value={formData.nombre} 
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 sm:py-2 focus:ring-2 focus:ring-blue-600 outline-none text-base sm:text-sm" 
                    placeholder="Ej: Bujía NGK" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Categoría</label>
                    <select 
                      value={formData.categoria} 
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})} 
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 sm:py-2 focus:ring-2 focus:ring-blue-600 outline-none bg-white text-base sm:text-sm appearance-none"
                    >
                      <option>Filtros</option>
                      <option>Fluidos</option>
                      <option>Frenos</option>
                      <option>Suspensión</option>
                      <option>Electricidad</option>
                      <option>Motor</option>
                      <option>Varios</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Stock Inicial</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={formData.stock} 
                      onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 sm:py-2 focus:ring-2 focus:ring-blue-600 outline-none text-base sm:text-sm" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Compatibilidad / Modelos</label>
                  <input 
                    type="text" 
                    value={formData.compatibilidad} 
                    onChange={(e) => setFormData({...formData, compatibilidad: e.target.value})} 
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 sm:py-2 focus:ring-2 focus:ring-blue-600 outline-none text-base sm:text-sm" 
                    placeholder="Ej: Universal, Amarok, etc." 
                  />
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="pt-6 sm:pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4 sm:mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 sm:py-2 text-slate-600 font-medium bg-slate-100 sm:bg-transparent hover:bg-slate-200 sm:hover:bg-slate-100 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors">
                    {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Guardando...</> : 'Guardar Repuesto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}