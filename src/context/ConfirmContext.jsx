import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [modal, setModal] = useState(null);

  const showConfirm = useCallback((options) => {
    const isObject = typeof options === 'object' && options !== null && !(options.$$typeof); // ensure it's not a React element
    
    return new Promise((resolve) => {
      setModal({
        title: isObject ? options.title : null,
        message: isObject ? options.message : options,
        confirmText: isObject ? options.confirmText : 'Confirm',
        cancelText: isObject ? options.cancelText : 'Cancel',
        type: isObject ? options.type : 'primary',
        onConfirm: () => {
          setModal(null);
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm: showConfirm }}>
      {children}
      {modal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px',
          animation: 'fadeIn 0.25s ease-in-out forwards'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            border: '1px solid #edf2f7',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            {modal.title && (
              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: modal.type === 'danger' ? '#dc2626' : '#111111',
                margin: '0 0 -8px 0',
                textAlign: 'center'
              }}>
                {modal.title}
              </h3>
            )}
            <p style={{
              fontSize: modal.title ? '0.95rem' : '1rem',
              fontWeight: modal.title ? 500 : 700,
              color: modal.title ? '#475569' : '#111111',
              lineHeight: 1.5,
              margin: 0,
              textAlign: 'center'
            }}>
              {modal.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={modal.onCancel}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #edf2f7',
                  background: '#f8fafc',
                  color: '#4a5568',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#edf2f7';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {modal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={modal.onConfirm}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: modal.type === 'danger' ? '#dc2626' : '#b31522',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = modal.type === 'danger' ? '#b91c1c' : '#960f1a';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = modal.type === 'danger' ? '#dc2626' : '#b31522';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {modal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};
