import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, user } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      window.location.hash = '#/profile';
    }
  }, [user]);

  if (user) return null;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      window.location.hash = '#/profile';
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      window.location.hash = '#/profile';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', paddingBottom: '8rem', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
            {isLogin ? 'Access Denied' : 'Join the Elite'}
          </h2>
          <p style={{ margin: 0, color: 'var(--dim-text)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {isLogin ? 'Authenticate to continue' : 'Create your operative profile'}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL ADDRESS"
              required
              className="interactive"
              style={{
                width: '100%',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--text-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              required
              className="interactive"
              style={{
                width: '100%',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--text-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <button
            type="submit"
            className="interactive"
            style={{
              width: '100%',
              backgroundColor: 'var(--text-color)',
              color: 'var(--bg-color)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              }}
          >
            {isLogin ? 'Execute Login' : 'Execute Signup'}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '2rem 0' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', borderTop: '1px solid var(--border-color)' }}></div>
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <span style={{ padding: '0 0.5rem', backgroundColor: 'var(--bg-color)', color: 'var(--dim-text)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Or continue with
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          className="interactive"
          style={{
            width: '100%',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-color)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            }}
          onMouseEnter={(e) => e.target.style.borderColor = 'var(--text-color)'}
          onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="interactive"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--dim-text)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-color)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--dim-text)'}
          >
            {isLogin ? 'No profile? Create one.' : 'Already operative? Login.'}
          </button>
        </div>
      </div>
    </div>
  );
}
