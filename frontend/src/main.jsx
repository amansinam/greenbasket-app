import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1b4332',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            borderRadius: '8px',
          },
          success: { iconTheme: { primary: '#52b788', secondary: '#fff' } },
          error: { style: { background: '#c0392b' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);
