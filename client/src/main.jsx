import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import { CupModeProvider } from './context/CupModeContext.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CupModeProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '16px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: '700',
              },
            }}
          />
        </CupModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
