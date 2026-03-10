import { useState } from 'react';
import { CarFront, Wrench, Check, CalendarPlus } from 'lucide-react';

// Mock de datos para los selectores
const MARCAS = ['Volkswagen', 'Ford', 'Chevrolet', 'Toyota', 'Fiat', 'Peugeot', 'Renault', 'Honda'];

// Generador dinámico de años: Desde el año actual hasta 1990 (en orden descendente)
const currentYear = new Date().getFullYear();
const ANIOS = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

const CATEGORIAS_TRABAJO = {
  'Diagnóstico y Electrónica': [
    'Escaneo Computarizado (OBD2)', 
    'Reseteo de Testigos / ECU', 
    'Revisión de Batería y Carga', 
    'Reparación de Alternador/Arranque', 
    'Cambio de Sensores (ABS, Oxígeno)'
  ],
  'Climatización y Refrigeración': [
    'Carga de Gas Aire Acondicionado', 
    'Detección de Pérdidas de AC', 
    'Reparación de Compresor AC', 
    'Cambio de Radiador / Electroventilador', 
    'Limpieza de Circuito de Agua'
  ],
  'Mantenimiento General': [
    'Cambio de Aceite y Filtros', 
    'Cambio de Fluidos (Caja, Dirección)', 
    'Cambio Filtro de Habitáculo', 
    'Revisión General de 20 Puntos',
    'Lubricación General'
  ],
  'Motor y Transmisión': [
    'Kit de Distribución (Correa/Cadena)', 
    'Bomba de Agua y Termostato', 
    'Cambio de Bujías y Bobinas', 
    'Limpieza de Inyectores', 
    'Kit de Embrague Completo', 
    'Junta de Tapa de Cilindros'
  ],
  'Tren Delantero y Dirección': [
    'Alineación y Balanceo', 
    'Amortiguadores y Espirales', 
    'Bujes, Rótulas y Extremos', 
    'Cremallera de Dirección', 
    'Semiejes y Homocinéticas'
  ],
  'Frenos': [
    'Cambio de Pastillas y Discos', 
    'Rectificado de Discos', 
    'Cintas y Campanas', 
    'Purga y Líquido de Frenos', 
    'Reparación de Calipers'
  ],
  'Otros Trabajos': [
    'Rotación de Neumáticos', 
    'Reparación de Escape', 
    'Cambio de Ópticas / Lámparas', 
    'Trabajo de Tornería / Soldadura'
  ]
};

export default function CheckIn() {
  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: '', 
  });

  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);

  const handleInputChange = (e) => {
    // Si es patente, forzamos mayúsculas, sino texto normal
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const fechaIngreso = new Date();
    
    const ordenDeTrabajo = {
      ...formData,
      servicios: serviciosSeleccionados,
      fechaIngreso: fechaIngreso.toISOString(),
      estado: 'Abierta'
    };

    console.log("Generando OT +1 con estos datos:", ordenDeTrabajo);
    alert("¡Orden de Trabajo simulada con éxito! Mirá la consola (F12).");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <CalendarPlus className="text-blue-600" size={32} />
            Nuevo Ingreso
          </h2>
          <p className="mt-2 text-slate-500">Completá los datos para generar una nueva Orden de Trabajo.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600 font-medium">
          {new Date().toLocaleDateString('es-AR')}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Datos del Vehículo */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
              <CarFront className="text-blue-500" />
              Datos del Vehículo
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patente</label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente}
                  onChange={handleInputChange}
                  placeholder="Ej: AB123CD o LLL123"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                <select
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white"
                  required
                >
                  <option value="">Seleccione una marca</option>
                  {MARCAS.map(marca => (
                    <option key={marca} value={marca}>{marca}</option>
                  ))}
                </select>
              </div>

              {/* GRID PARA MODELO Y AÑO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    placeholder="Ej: Gol Trend"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                  <select
                    name="anio"
                    value={formData.anio}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white"
                    required
                  >
                    <option value="">Año</option>
                    {ANIOS.map(anio => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Checklist de Trabajos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
              <Wrench className="text-blue-500" />
              Trabajo a Realizar (Checklist)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(CATEGORIAS_TRABAJO).map(([categoria, servicios]) => (
                <div key={categoria} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-3">{categoria}</h4>
                  <div className="space-y-2">
                    {servicios.map(servicio => {
                      const isSelected = serviciosSeleccionados.includes(servicio);
                      return (
                        <label 
                          key={servicio} 
                          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-200 ${
                            isSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'hover:bg-slate-100 border-transparent'
                          } border`}
                        >
                          {/* El input real está oculto pero hace que el label funcione perfecto */}
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={isSelected}
                            onChange={() => toggleServicio(servicio)}
                          />
                          
                          {/* Cuadradito visual (Verde cuando está activo) */}
                          <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                          </div>
                          
                          <span className={`text-sm select-none ${isSelected ? 'text-emerald-900 font-semibold' : 'text-slate-600'}`}>
                            {servicio}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={serviciosSeleccionados.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              Generar Orden de Trabajo
            </button>
          </div>
          {serviciosSeleccionados.length === 0 && (
            <p className="text-right text-sm text-red-500 mt-2">
              * Seleccioná al menos un servicio para continuar.
            </p>
          )}
        </div>

      </form>
    </div>
  );
}