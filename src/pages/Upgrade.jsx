import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function Upgrade() {
  const { user, isPro } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(null);

  const [isIndia, setIsIndia] = useState(false);

  useEffect(() => {
    // If not logged in, force them to login first
    if (!user) {
      window.location.hash = '#/login';
    }
    // If already Pro, send them back to profile
    else if (isPro) {
      window.location.hash = '#/profile';
    }

    // Detect if user is in India based on Timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
        setIsIndia(true);
      }
    } catch (e) {
      // fallback
    }
  }, [user, isPro]);

  if (!user || isPro) return null;

  const verifyPaymentWithBackend = async (provider, paymentDetails) => {
    try {
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, uid: user.uid, paymentDetails })
      });

      if (!res.ok) {
        throw new Error("Backend verification failed. The server returned an error.");
      }
      
      setSuccess(true);
      setPendingVerification(null);
      setTimeout(() => {
        window.location.hash = '#/profile';
        window.location.reload(); 
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Payment verification failed. Your money may have been deducted, but we couldn't reach the server.");
      setPendingVerification({ provider, paymentDetails });
    }
  };

  const handlePayPalApprove = async (data, actions) => {
    try {
      const order = await actions.order.capture();
      if (order.status === "COMPLETED") {
        await verifyPaymentWithBackend('paypal', { orderID: order.id });
      }
    } catch (err) {
      console.error(err);
      setError("PayPal capture failed. Please try again or contact support.");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayClick = async () => {
    setError('');
    const res = await loadRazorpayScript();
    if (!res) {
      setError('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      const orderRes = await fetch('/api/create-razorpay-order', { method: 'POST' });
      if (!orderRes.ok) {
        throw new Error('Backend not running or configuration missing. Check Vercel logs.');
      }
      const orderData = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_fallback",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Execute Pro",
        description: "Lifetime Pro License",
        order_id: orderData.id,
        handler: async function (response) {
          await verifyPaymentWithBackend('razorpay', response);
        },
        theme: {
          color: "#22c55e"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not initiate Razorpay. Are backend keys set?");
    }
  };

  return (
    <div style={{ flex: 1, padding: '2rem 1.5rem', paddingBottom: '6rem', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Unlock Pro Mode
        </h1>
        <p style={{ color: 'var(--dim-text)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          The local-only version of Execute is free forever. To enable Cross-Device Cloud Sync and encrypted backups, upgrade your operative license.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Features List */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem' }}>
            Pro License Features
          </h2>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Real-time Cloud Sync</h3>
                <p style={{ color: 'var(--dim-text)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', margin: 0, lineHeight: '1.4' }}>Your tasks and XP instantly synchronize across your desktop, laptop, and mobile devices.</p>
              </div>
            </li>

            <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Encrypted Backups</h3>
                <p style={{ color: 'var(--dim-text)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', margin: 0, lineHeight: '1.4' }}>Never lose your progression data if you clear your browser cache or change devices.</p>
              </div>
            </li>

            <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Lifetime Access</h3>
                <p style={{ color: 'var(--dim-text)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', margin: 0, lineHeight: '1.4' }}>A single one-time payment. No subscriptions. No recurring fees.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Checkout Box */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {isIndia ? '₹499' : '$9.99'}
            </div>
            <div style={{ color: 'var(--dim-text)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>One-time payment</div>
          </div>

          {success ? (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>ACCESS GRANTED</div>
              <div style={{ fontSize: '0.85rem' }}>Upgrading your account...</div>
            </div>
          ) : pendingVerification ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Connection Lost During Verification</strong>
                Your payment was captured by {pendingVerification.provider}, but we couldn't verify it with our secure server to upgrade your account.
              </div>
              <button 
                onClick={() => verifyPaymentWithBackend(pendingVerification.provider, pendingVerification.paymentDetails)}
                className="interactive"
                style={{
                  backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', padding: '1rem',
                  fontSize: '1rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em', width: '100%'
                }}
              >
                Retry Verification
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 0 }}>
              {error && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  {error}
                </div>
              )}
              
              {isIndia ? (
                <button 
                  onClick={handleRazorpayClick}
                  className="interactive"
                  style={{
                    backgroundColor: 'var(--text-color)',
                    color: 'var(--bg-color)',
                    border: '2px solid var(--text-color)',
                    padding: '1rem',
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    
                    transition: 'all 0.2s ease',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Pay via UPI / Cards
                </button>
              ) : (
                <PayPalButtons 
                  style={{ 
                    layout: "vertical", 
                    color: "white", 
                    shape: "rect",
                    label: "checkout"
                  }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          amount: {
                            value: "9.99",
                            currency_code: "USD"
                          }
                        }
                      ]
                    });
                  }}
                  onApprove={handlePayPalApprove}
                  onError={(err) => {
                    console.error(err);
                    setError("An error occurred during checkout.");
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
