import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Remount app state whenever the signed-in user changes.
function UserScopedApp({ children }) {
  const { user } = useAuth();
  return (
    <AppProvider key={user?.id ?? 'guest'} userId={user?.id}>
      {children}
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <UserScopedApp>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </UserScopedApp>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
