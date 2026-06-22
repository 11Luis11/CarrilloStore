import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import SEO from '../../components/SEO';

export default function AdminLogin({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@carrillostore.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      // Registrar sesión y redirigir
      localStorage.setItem('admin_logged_in', 'true');
      onLogin();
      navigate('/admin/dashboard');
    } else {
      setError('Por favor, ingresa credenciales válidas.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '24px'
    }}>
      <SEO title="Iniciar Sesión - Admin" description="Acceso al Panel Administrativo Carrillo Store." />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '0px',
            border: '1px solid var(--text-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            <Lock size={20} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-0.01em' }}>Acceso Administrativo</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Panel de control y facturación POS Carrillo Store
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Correo electrónico
            </label>
            <input 
              type="email"
              required
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Contraseña
            </label>
            <input 
              type="password"
              required
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ fontSize: '14px' }}
            />
          </div>

          {error && <p style={{ color: 'var(--color-secondary)', fontSize: '12px' }}>{error}</p>}

          <button 
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '0px', marginTop: '8px' }}
          >
            Acceder al panel <ArrowRight size={16} />
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#F3F4F6',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
          <span>Acceso libre. Puedes hacer clic en Acceder con los valores por defecto.</span>
        </div>
      </div>
    </div>
  );
}
