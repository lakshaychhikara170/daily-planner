import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, user, resetPassword } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError("Account not found or incorrect password. If you don't have a profile, click 'Create one' below.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please click 'Login' below.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError(err.message || "An error occurred during authentication.");
      }
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      window.location.hash = '#/profile';
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        setError("Your browser blocked the Google login window. Please allow popups or use a different browser.");
      } else {
        setError(err.message || "Google login failed.");
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to reset your password.");
      return;
    }
    setError('');
    setMsg('');
    try {
      await resetPassword(email);
      setMsg("Password reset email sent! Check your inbox.");
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

        {msg && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#22c55e', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            {msg}
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
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
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
                paddingRight: '3rem',
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
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--dim-text)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              {showPassword ? (
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
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
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
        <p style={{ margin: '-1rem 0 0 0', textAlign: 'center', fontSize: '0.7rem', color: 'var(--dim-text)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: '1.4' }}>
          *If you use Brave or strict ad-blockers, Google login may fail.<br/>Please use Email & Password instead.
        </p>

        <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          {isLogin && (
            <button
              onClick={handleForgotPassword}
              className="interactive"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--dim-text)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-color)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--dim-text)'}
            >
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
