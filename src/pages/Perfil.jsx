import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function Perfil() {
  const { currentUser, changePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await changePassword(password);
      
      setSuccess('¡Contraseña actualizada correctamente!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Error al actualizar contraseña:", err);
      // Firebase por seguridad exige que el usuario se haya logueado recientemente para cambiar la clave
      if (err.code === 'auth/requires-recent-login') {
        setError('Por seguridad, debes cerrar sesión y volver a ingresar para cambiar tu contraseña.');
      } else {
        setError('Hubo un error al actualizar la contraseña. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <User className="text-blue-600" size={32} />
          Perfil de Usuario
        </h2>
        <p className="mt-2 text-slate-500">Gestioná las credenciales y la seguridad de tu cuenta.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">
            {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Administrador</h3>
            <p className="text-slate-500 text-sm">{currentUser?.email}</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h4 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Cambiar Contraseña</h4>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-md space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none bg-slate-50 focus:bg-white transition-colors"
                  placeholder="Mínimo 6 caracteres"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none bg-slate-50 focus:bg-white transition-colors"
                  placeholder="Repetí la contraseña"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 w-full md:w-auto"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}