import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { UIContextProvider } from './context/UIContext.jsx'
import UIProvider from './components/ui/UIProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <UIContextProvider>
          <UIProvider />
          <App />
        </UIContextProvider>
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
)
