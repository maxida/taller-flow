import { useState } from 'react';
import { CarFront, Wrench, Check, CalendarPlus, Loader2, Camera, X, ImagePlus } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // <-- Importamos Storage
import { db, storage } from '../firebase/config'; // <-- Traemos Storage de nuestra config

const MARCAS = ['Volkswagen', 'Ford', 'Chevrolet', 'Toyota', 'Fiat', 'Peugeot', 'Renault', 'Honda', 'Hyundai', 'Nissan', 'Citroën', 'Mitsubishi', 'Subaru', 'Suzuki', 'Kia', 'Mazda', 'Dodge', 'Jeep', 'Ram', 'GMC'];
const currentYear = new Date().getFullYear();
const ANIOS = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

const CATEGORIAS_TRABAJO = {
  'Diagnóstico y Electrónica': ['Diagnóstico Computarizado (Escaneo)', 'Reseteo de Testigos / ECU', 'Revisión de Batería y Carga', 'Reparación de Arranque / Alternador', 'Cambio de Sensores (ABS, Oxígeno)'],
  'Climatización y Refrigeración': ['Sistema de Aire Acondicionado (Carga/Fugas)', 'Reparación de Compresor AC', 'Cambio de Radiador / Electroventilador', 'Limpieza de Circuito de Agua'],
  'Mantenimiento General': ['Cambio de Aceite y Filtros', 'Cambio de Fluidos (Caja, Dirección)', 'Cambio Filtro de Habitáculo', 'Revisión General de 20 Puntos', 'Lubricación General'],
  'Motor y Transmisión': ['Kit de Distribución (Correa/Cadena)', 'Bomba de Agua y Termostato', 'Cambio de Bujías y Bobinas', 'Servicio de Inyección Electrónica', 'Cambio de Kit de Embrague', 'Junta de Tapa de Cilindros'],
  'Tren Delantero y Dirección': ['Alineación y Balanceo', 'Amortiguadores y Espirales', 'Bujes, Rótulas y Extremos', 'Cremallera de Dirección', 'Semiejes y Homocinéticas'],
  'Frenos': ['Cambio de Pastillas y Discos', 'Rectificado de Discos', 'Cintas y Campanas', 'Purga y Líquido de Frenos', 'Reparación de Calipers'],
  'Otros Trabajos': ['Rotación de Neumáticos', 'Reparación de Escape', 'Cambio de Ópticas / Lámparas', 'Trabajo de Tornería / Soldadura']
};

const ZONAS_FOTOS = [
  { id: 'tablero', label: 'Tablero / Km' },
  { id: 'frente', label: 'Frente' },
  { id: 'trasera', label: 'Parte Trasera' },
  { id: 'izquierdo', label: 'Lat. Izquierdo' },
  { id: 'derecho', label: 'Lat. Derecho' }
];

export default function CheckIn() {
  const [formData, setFormData] = useState({ patente: '', marca: '', modelo: '', anio: '' });
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  
  // Estados para las fotos
  const [fotosFiles, setFotosFiles] = useState({});
  const [fotosPreviews, setFotosPreviews] = useState({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState(''); // Para avisar que estamos subiendo imágenes

  const handleInputChange = (e) => {
    const value = e.target.name === 'patente' ? e.target.value.toUpperCase() : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const toggleServicio = (servicio) => {
    if (serviciosSeleccionados.includes(servicio)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter((s) => s !== servicio));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, servicio]);
    }
  };

  // Manejador de selección de imágenes
  const handleFotoChange = (e, zonaId) => {
    const file = e.target.files[0];
    if (file) {
      // Guardamos el archivo original para subirlo luego
      setFotosFiles(prev => ({ ...prev, [zonaId]: file }));
      // Generamos una URL temporal para mostrar la miniatura en pantalla
      setFotosPreviews(prev => ({ ...prev, [zonaId]: URL.createObjectURL(file) }));
    }
  };

  // Manejador para borrar una imagen seleccionada
  const eliminarFoto = (zonaId) => {
    setFotosFiles(prev => { const nuevo = {...prev}; delete nuevo[zonaId]; return nuevo; });
    setFotosPreviews(prev => { const nuevo = {...prev}; delete nuevo[zonaId]; return nuevo; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      setEstadoCarga('Generando N° de Orden...');
      const q = query(collection(db, "ordenes"), orderBy("numero", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      let nuevoNumero = 1;
      if (!querySnapshot.empty) {
        nuevoNumero = querySnapshot.docs[0].data().numero + 1;
      }
      const idFormat = `OT-${String(nuevoNumero).padStart(4, '0')}`;
      
      const ahora = new Date();
      const year = ahora.getFullYear();
      const month = String(ahora.getMonth() + 1).padStart(2, '0');
      const day = String(ahora.getDate()).padStart(2, '0');
      const fechaIngreso = `${year}-${month}-${day}`; 
      const horaIngreso = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      // LÓGICA DE SUBIDA DE FOTOS
      setEstadoCarga('Subiendo imágenes al servidor...');
      const urlsFotos = {};
      
      for (const zona of ZONAS_FOTOS) {
        if (fotosFiles[zona.id]) {
          // Creamos la referencia en Firebase Storage (ej: ordenes/OT-0005/frente)
          const fotoRef = ref(storage, `ordenes/${idFormat}/${zona.id}`);
          // Subimos el archivo
          await uploadBytes(fotoRef, fotosFiles[zona.id]);
          // Obtenemos la URL pública de la imagen
          const url = await getDownloadURL(fotoRef);
          urlsFotos[zona.id] = url;
        }
      }

      setEstadoCarga('Guardando datos finales...');
      const nuevaOrden = {
        id_ot: idFormat,
        numero: nuevoNumero,
        patente: formData.patente,
        marca: formData.marca,
        modelo: formData.modelo,
        anio: formData.anio,
        servicios: serviciosSeleccionados,
        fotos: urlsFotos, // <-- Guardamos las URLs de las fotos aquí
        fecha: fechaIngreso,
        horaIngreso: horaIngreso, 
        estado: 'Abierta',
        informe: '',
        diagnostico: '', 
        timestamp: ahora
      };

      await addDoc(collection(db, "ordenes"), nuevaOrden);
      alert(`¡Éxito! Se generó la ${idFormat} a las ${horaIngreso} hs.`);
      
      // Limpiamos todo
      setFormData({ patente: '', marca: '', modelo: '', anio: '' });
      setServiciosSeleccionados([]);
      setFotosFiles({});
      setFotosPreviews({});
      
    } catch (error) {
      console.error("Error al guardar: ", error);
      alert("Hubo un error. Revisá la consola.");
    } finally {
      setIsSubmitting(false);
      setEstadoCarga('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <CalendarPlus className="text-blue-600" size={32} /> Nuevo Ingreso
          </h2>
          <p className="mt-2 text-slate-500">Completá los datos y adjuntá el estado visual para generar la OT.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600 font-medium">
          {new Date().toLocaleDateString('es-AR')}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Vehículo y Fotos */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Tarjeta 1: Datos Vehículo */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
              <CarFront className="text-blue-500" /> Datos del Vehículo
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patente</label>
                <input type="text" name="patente" value={formData.patente} onChange={handleInputChange} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none uppercase" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                <select name="marca" value={formData.marca} onChange={handleInputChange} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none bg-white" required>
                  <option value="">Seleccione marca</option>
                  {MARCAS.map(marca => <option key={marca} value={marca}>{marca}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input type="text" name="modelo" value={formData.modelo} onChange={handleInputChange} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                  <select name="anio" value={formData.anio} onChange={handleInputChange} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none bg-white" required>
                    <option value="">Año</option>
                    {ANIOS.map(anio => <option key={anio} value={anio}>{anio}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Estado Visual (Fotos) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2 border-b pb-3">
              <Camera className="text-blue-500" /> Estado Visual (Fotos)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Recomendado para evitar reclamos.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {ZONAS_FOTOS.map((zona, index) => (
                <div key={zona.id} className={`${index === 0 ? 'col-span-2' : 'col-span-1'}`}>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{zona.label}</label>
                  
                  {fotosPreviews[zona.id] ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100">
                      <img src={fotosPreviews[zona.id]} alt={zona.label} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => eliminarFoto(zona.id)} 
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors">
                      <ImagePlus className="text-slate-400 mb-1" size={20} />
                      <span className="text-xs text-slate-500 font-medium">Adjuntar</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFotoChange(e, zona.id)} 
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Checklist y Botón de Envío */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
              <Wrench className="text-blue-500" /> Trabajo a Realizar (Checklist)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(CATEGORIAS_TRABAJO).map(([categoria, servicios]) => (
                <div key={categoria} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-3">{categoria}</h4>
                  <div className="space-y-2">
                    {servicios.map(servicio => {
                      const isSelected = serviciosSeleccionados.includes(servicio);
                      return (
                        <label key={servicio} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-200 ${isSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'hover:bg-slate-100 border-transparent'} border`}>
                          <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleServicio(servicio)} />
                          <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                          </div>
                          <span className={`text-sm select-none ${isSelected ? 'text-emerald-900 font-semibold' : 'text-slate-600'}`}>{servicio}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={serviciosSeleccionados.length === 0 || isSubmitting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-8 rounded-lg shadow-sm flex items-center gap-2 transition-all">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> 
                  {estadoCarga}
                </>
              ) : 'Generar Orden de Trabajo'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}