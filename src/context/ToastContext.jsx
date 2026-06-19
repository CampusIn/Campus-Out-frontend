import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const success = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg) => showToast(msg, 'error'), [showToast]);
  const warning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);
  const info = useCallback((msg) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="toast-portal-container">
        {toasts.map((t) => {
          let icon = 'ℹ️';
          if (t.type === 'success') icon = '✅';
          if (t.type === 'error') icon = '❌';
          if (t.type === 'warning') icon = '⚠️';

          return (
            <div key={t.id} className={`toast-item toast-${t.type}`} onClick={() => removeToast(t.id)}>
              <span className="toast-icon">{icon}</span>
              <span className="toast-message">{t.message}</span>
              <button className="toast-close-btn">&times;</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
