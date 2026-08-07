import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'

const paypalOptions = {
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
  currency: "USD",
  intent: "capture"
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PayPalScriptProvider options={paypalOptions}>
        <AppProvider>
          <App />
        </AppProvider>
      </PayPalScriptProvider>
    </AuthProvider>
  </StrictMode>,
)
