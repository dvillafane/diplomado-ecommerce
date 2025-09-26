// src/pages/Register.jsx
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import useStore from '../store/store';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { ROUTES } from '../utils/constants';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [phone, setPhone] = useState('');
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const validateEmail = (e) => /\S+@\S+\.\S+/.test(e);
  const validatePhone = (p) => /^\+?\d{10,15}$/.test(p); // Basic phone validation

  const handleRegister = async () => {
    setToast(null);
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

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        phone: phone, // Add phone number to Firestore
        isAdmin: false,
        createdAt: new Date()
      });
      setUser(user);
      setToast({ type: 'success', text: 'Cuenta creada con éxito 🎉' });
      setTimeout(() => navigate(ROUTES.HOME), 1000);
    } catch (err) {
      console.error(err);
      setToast({ type: 'danger', text: 'Error al registrar. Verifica los datos.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h1 className="mb-3">Registro</h1>
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
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1060 }}>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default Register;