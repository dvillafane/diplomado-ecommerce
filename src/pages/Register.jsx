// src/pages/Register.jsx
// Componente funcional que gestiona el registro de nuevos usuarios en la aplicación
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import useStore from '../store/store';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { ROUTES } from '../utils/constants';

// Componente principal para la página de registro
const Register = () => {
  // Estados locales para gestionar los datos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [phone, setPhone] = useState('');
  const { setUser } = useStore(); // Función del store para establecer el usuario autenticado
  const [loading, setLoading] = useState(false); // Estado para el botón de registro
  const [toast, setToast] = useState(null); // Estado para mostrar notificaciones
  const navigate = useNavigate(); // Hook para manejar la navegación

  // Función para validar el formato del correo electrónico
  const validateEmail = (e) => /\S+@\S+\.\S+/.test(e);
  // Función para validar el formato del número de celular
  const validatePhone = (p) => /^\+?\d{10,15}$/.test(p); // Basic phone validation

  // Función para manejar el proceso de registro
  const handleRegister = async () => {
    setToast(null); // Limpia notificaciones previas
    // Validaciones de campos requeridos y formato
    if (!email || !password || !phone) { 
      setToast({ type: 'danger', text: 'Email, contraseña y celular son obligatorios.' }); 
      return; 
    }
    if (!validateEmail(email)) { 
      setToast({ type: 'danger', text: 'Email inválido.'}); 
      return; 
    }
    if (password.length < 6) { 
      setToast({ type: 'danger', text: 'La contraseña debe tener al menos 6 caracteres.'}); 
      return; 
    }
    if (password !== password2) { 
      setToast({ type: 'danger', text: 'Las contraseñas no coinciden.'}); 
      return; 
    }
    if (!validatePhone(phone)) { 
      setToast({ type: 'danger', text: 'Número de celular inválido (10-15 dígitos).'}); 
      return; 
    }

    setLoading(true); // Activa el estado de carga
    try {
      // Crea un nuevo usuario con Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Almacena datos adicionales del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        phone: phone, // Add phone number to Firestore
        isAdmin: false,
        createdAt: new Date()
      });
      setUser(user); // Actualiza el store con el usuario autenticado
      setToast({ type: 'success', text: 'Cuenta creada con éxito 🎉' });
      setTimeout(() => navigate(ROUTES.HOME), 1000); // Redirige a la página principal tras 1s
    } catch (err) {
      console.error(err);
      setToast({ type: 'danger', text: 'Error al registrar. Verifica los datos.' });
    } finally {
      setLoading(false); // Desactiva el estado de carga
    }
  };

  // Renderiza la interfaz de la página de registro
  return (
    <div className="container my-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h1 className="mb-3">Registro</h1>
            {/* Campo para el correo electrónico */}
            <div className="mb-3">
              <input
                type="email"
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
                placeholder="Contraseña (min 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Contraseña"
              />
            </div>
            {/* Campo para confirmar la contraseña */}
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Confirmar contraseña"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                aria-label="Confirmar contraseña"
              />
            </div>
            {/* Campo para el número de celular */}
            <div className="mb-3">
              <input
                type="tel"
                className="form-control"
                placeholder="Número de celular (ej. +1234567890)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-label="Número de celular"
              />
            </div>
            {/* Botones para registrarse y volver al inicio de sesión */}
            <button
              className="btn btn-primary w-100 mb-2"
              onClick={handleRegister}
              disabled={loading}
              aria-label="Registrarse"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => navigate(ROUTES.LOGIN)}
              aria-label="Ir a inicio de sesión"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
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

export default Register;