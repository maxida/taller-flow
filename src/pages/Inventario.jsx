import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle, CheckCircle, Loader2, X, Minus, ChevronRight } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

// CATÁLOGO BASE (Para inyectar si la base de datos está vacía)
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
  
  // Estados para el Modal ABM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', categoria: 'Filtros', compatibilidad: '', stock: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventario = async () => {
    try {
      // Ordenar por nombre (A -> Z). También se aplica un sort local como respaldo.
      const q = query(collection(db, "inventario"), orderBy("nombre", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Asegurar orden alfabético en caso de que algún documento no tenga el campo o haya discrepancias
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

  // Función para cargar los datos por defecto si está vacío
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

  // Ajuste rápido de stock (+ o -) desde la tabla
  const handleAjusteRapido = async (id, stockActual, cantidadSumar) => {
    const nuevoStock = stockActual + cantidadSumar;
    if (nuevoStock < 0) return; // No puede haber stock negativo

    try {
      setItems(items.map(item => item.id === id ? { ...item, stock: nuevoStock } : item)); // UI Optimizada en vivo
      await updateDoc(doc(db, "inventario", id), { stock: nuevoStock });
    } catch (error) {
      console.error("Error al actualizar stock: ", error);
      fetchInventario(); // Revertir en caso de error
    }
  };

  // Guardar (Crear o Editar) desde el Modal
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

  // Filtrado en vivo
  const filtrados = items.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh] text-blue-600"><Loader2 className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-10 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Package className="text-blue-600" size={32} /> Control de Inventario
          </h2>
          <p className="mt-2 text-slate-500">Administrá el stock de repuestos e insumos del taller.</p>
        </div>
        <button onClick={abrirModalParaNuevo} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2">
          <Plus size={20} /> Nuevo Repuesto
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center shadow-sm">
          <Package size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-2xl font-bold text-slate-700 mb-2">El inventario está vacío</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">No hay ningún repuesto cargado en la base de datos. Podés agregar uno manualmente o cargar un listado base predeterminado.</p>
          <button onClick={handleCargarInventarioBase} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-md inline-flex items-center gap-2">
            <CheckCircle size={20} /> Generar Inventario Base
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Barra de Búsqueda */}
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar repuesto o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Tabla de Inventario */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Artículo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Compatibilidad</th>
                  <th className="p-4 text-center">Stock Actual</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{item.nombre}</td>
                    <td className="p-4 text-slate-600"><span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-xs">{item.categoria}</span></td>
                    <td className="p-4 text-slate-600 text-sm truncate max-w-[200px]">{item.compatibilidad || '-'}</td>
                    
                    {/* Celda de Stock con Ajuste Rápido */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleAjusteRapido(item.id, item.stock, -1)} disabled={item.stock === 0} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
                          <Minus size={18} />
                        </button>
                        <span className={`text-lg font-black w-8 text-center ${item.stock === 0 ? 'text-red-500' : 'text-slate-800'}`}>
                          {item.stock}
                        </span>
                        <button onClick={() => handleAjusteRapido(item.id, item.stock, 1)} className="p-1 rounded-full text-slate-400 hover:bg-emerald-100 hover:text-emerald-700">
                          <Plus size={18} />
                        </button>
                      </div>
                    </td>

                    {/* Celda de Acciones */}
                    <td className="p-4 text-right">
                      <button onClick={() => abrirModalParaEditar(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleEliminar(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors ml-1" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No se encontraron repuestos con "{searchTerm}"</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {itemEditando ? 'Editar Repuesto' : 'Agregar Nuevo Repuesto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Artículo *</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ej: Bujía NGK" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial</label>
                  <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Compatibilidad / Modelos (Opcional)</label>
                <input type="text" value={formData.compatibilidad} onChange={(e) => setFormData({...formData, compatibilidad: e.target.value})} className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ej: Universal, VW Amarok, etc." />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2">
                  {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Guardando...</> : 'Guardar Repuesto'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}