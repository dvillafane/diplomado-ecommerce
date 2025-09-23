import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import useStore from '../store/store';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setToast(null);
    if (!email || !password) {
      setToast({ type: 'danger', text: 'Email y contraseña son obligatorios.' });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setToast({ type: 'success', text: 'Bienvenido' });
      navigate('/');
    } catch (err) {
      console.error(err);
      const code = err.code || '';
      if (code.includes('wrong-password')) setToast({ type: 'danger', text: 'Contraseña incorrecta.' });
      else if (code.includes('user-not-found')) setToast({ type: 'danger', text: 'No existe una cuenta con ese correo.' });
      else setToast({ type: 'danger', text: 'Credenciales inválidas. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setToast({ type: 'info', text: 'Ingresa tu correo para recuperar contraseña.' });
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setToast({ type: 'success', text: 'Email de recuperación enviado.' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'danger', text: 'No se pudo enviar el email.' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container my-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h1 className="mb-3">Iniciar sesión</h1>
            <div className="mb-3">
              <input
                type="email"
                autoFocus
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Correo electrónico"
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Contraseña"
              />
            </div>
            <div className="d-flex flex-column gap-2 mb-3">
              <button
                className="btn btn-primary w-100"
                onClick={handleLogin}
                disabled={loading}
                aria-label="Iniciar sesión"
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => navigate('/register')}
                aria-label="Ir a registro"
              >
                ¿No tienes cuenta? Regístrate
              </button>
              <button
                className="btn btn-link text-muted"
                onClick={handleReset}
                disabled={resetLoading}
                aria-label="Recuperar contraseña"
              >
                {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1060 }}>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default Login;