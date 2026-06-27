import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Lock, Mail, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, resetPassword } = useAuth();

  // Olvidé mi contraseña
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      setResetError('');
      setResetLoading(true);
      await resetPassword(resetEmail.trim());
      setResetSuccess(true);
    } catch (err) {
      console.error(err);
      setResetError('No se encontró ninguna cuenta con ese correo.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      
      // Magia nivel Senior: .trim() elimina los espacios accidentales antes o después del texto
      await login(email.trim(), password);
      
      // Si el login es exitoso, lo mandamos adentro
      navigate('/ingreso'); 
    } catch (err) {
      console.error("Error de autenticación en Firebase:", err);
      setError('Credenciales incorrectas. Verificá tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 relative overflow-hidden animated-bg">
      {/* MAGIA CSS: Gradiente fluido en movimiento constante */}
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-bg {
          background: linear-gradient(-45deg, #0f172a, #1e1b4b, #172554, #020617);
          background-size: 400% 400%;
          animation: gradientMove 15s ease infinite;
        }
      `}</style>

      {/* EFECTO 2026: Luces difuminadas flotantes responsivas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full bg-blue-600/20 blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full bg-indigo-600/20 blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      {/* CONTENEDOR DEL FORMULARIO */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative z-10">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <img src={logoImg} alt="JOTA M." className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-3 sm:mb-4" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 text-center">
            {forgotMode ? 'Recuperar Contraseña' : 'Acceso a Taller Flow'}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">v2.1</p>
        </div>

        {/* ── MODO OLVIDÉ CONTRASEÑA ── */}
        {forgotMode ? (
          <div>
            {resetSuccess ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <CheckCircle size={48} className="text-emerald-500" />
                <p className="text-slate-700 font-medium text-center text-sm sm:text-base">
                  ¡Listo! Te enviamos un correo a <span className="font-bold">{resetEmail}</span> con las instrucciones para restablecer tu contraseña.
                </p>
                <button
                  onClick={() => { setForgotMode(false); setResetSuccess(false); setResetEmail(''); }}
                  className="mt-2 text-blue-600 font-bold hover:underline flex items-center gap-1 text-sm sm:text-base"
                >
                  <ArrowLeft size={16} /> Volver al inicio
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4 sm:space-y-5">
                <p className="text-xs sm:text-sm text-slate-500 -mt-2 sm:-mt-4 mb-2">
                  Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                {resetError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center">{resetError}</div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-base sm:text-sm"
                      placeholder="taller@gmail.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2"
                >
                  {resetLoading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar recuperación'}
                </button>

                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setResetError(''); setResetEmail(''); }}
                  className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium flex justify-center items-center gap-1 mt-2"
                >
                  <ArrowLeft size={15} /> Volver al inicio
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── MODO LOGIN NORMAL ── */
          <>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-4 sm:mb-6 text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-base sm:text-sm" 
                    placeholder="taller@gmail.com" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-base sm:text-sm" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setResetEmail(email); setResetError(''); setResetSuccess(false); }}
                    className="text-sm text-blue-600 hover:underline font-medium p-1 -mr-1"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2 mt-2 sm:mt-4"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Ingresar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}