// src/pages/Login.jsx
// Componente funcional que gestiona el inicio de sesión y la recuperación de contraseña
import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import useStore from '../store/store';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { ROUTES } from '../utils/constants';

// Componente principal para la página de inicio de sesión
const Login = () => {
  // Estados locales para gestionar los datos del formulario y el estado de carga
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useStore(); // Función del store para establecer el usuario autenticado
  const [loading, setLoading] = useState(false); // Estado para el botón de inicio de sesión
  const [resetLoading, setResetLoading] = useState(false); // Estado para el botón de recuperación
  const [toast, setToast] = useState(null); // Estado para mostrar notificaciones
  const navigate = useNavigate(); // Hook para manejar la navegación

  // Función para manejar el inicio de sesión
  const handleLogin = async () => {
    setToast(null); // Limpia notificaciones previas
    // Validación de campos requeridos
    if (!email || !password) {
      setToast({ type: 'danger', text: 'Email y contraseña son obligatorios.' });
      return;
    }
    setLoading(true); // Activa el estado de carga
    try {
      // Autentica al usuario con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user); // Actualiza el store con el usuario autenticado
      setToast({ type: 'success', text: 'Bienvenido' });
      navigate(ROUTES.HOME); // Redirige a la página principal
    } catch (err) {
      console.error(err);
      const code = err.code || '';
      // Maneja errores específicos de Firebase
      if (code.includes('wrong-password')) setToast({ type: 'danger', text: 'Contraseña incorrecta.' });
      else if (code.includes('user-not-found')) setToast({ type: 'danger', text: 'No existe una cuenta con ese correo.' });
      else setToast({ type: 'danger', text: 'Credenciales inválidas. Intenta de nuevo.' });
    } finally {
      setLoading(false); // Desactiva el estado de carga
    }
  };

  // Función para manejar la recuperación de contraseña
  const handleReset = async () => {
    if (!email) {
      setToast({ type: 'info', text: 'Ingresa tu correo para recuperar contraseña.' });
      return;
    }
    setResetLoading(true); // Activa el estado de carga para recuperación
    try {
      // Envía un correo de recuperación de contraseña con Firebase
      await sendPasswordResetEmail(auth, email);
      setToast({ type: 'success', text: 'Email de recuperación enviado.' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'danger', text: 'No se pudo enviar el email.' });
    } finally {
      setResetLoading(false); // Desactiva el estado de carga
    }
  };

  // Renderiza la interfaz de la página de inicio de sesión
  return (
    <div className="container my-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h1 className="mb-3">Iniciar sesión</h1>
            {/* Campo para el correo electrónico */}
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
            {/* Campo para la contraseña */}
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
            {/* Botones para iniciar sesión, registrarse y recuperar contraseña */}
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
                onClick={() => navigate(ROUTES.REGISTER)}
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
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Contenedor para notificaciones tipo toast */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1060 }}>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default Login;