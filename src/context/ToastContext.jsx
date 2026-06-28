import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: {
    Icon: CheckCircle2,
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.08)',
    border: 'rgba(22, 163, 74, 0.18)',
    iconBg: 'rgba(22, 163, 74, 0.14)',
  },
  error: {
    Icon: XCircle,
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.18)',
    iconBg: 'rgba(220, 38, 38, 0.14)',
  },
  warning: {
    Icon: AlertTriangle,
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.18)',
    iconBg: 'rgba(217, 119, 6, 0.14)',
  },
  info: {
    Icon: Info,
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)',
    border: 'rgba(37, 99, 235, 0.18)',
    iconBg: 'rgba(37, 99, 235, 0.14)',
  },
};

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

/* ─── Individual Toast Item ─── */
function ToastItem({ toast: t, onRemove }) {
  const config = TOAST_CONFIG[t.type] || TOAST_CONFIG.info;
  const { Icon } = config;

  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  const remainRef = useRef(AUTO_DISMISS_MS);
  const startRef = useRef(Date.now());

  // Touch / swipe state
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const cardRef = useRef(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(t.id), 200);
  }, [onRemove, t.id]);

  // Auto-dismiss timer
  const startTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    startRef.current = Date.now();
    timerRef.current = setTimeout(dismiss, remainRef.current);
  }, [dismiss]);

  const pauseTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    remainRef.current -= Date.now() - startRef.current;
    if (remainRef.current < 0) remainRef.current = 0;
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearTimeout(timerRef.current);
  }, [startTimer]);

  // Mobile swipe-to-dismiss
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    if (cardRef.current) {
      const opacity = Math.max(0, 1 - Math.abs(touchDeltaX.current) / 200);
      cardRef.current.style.transform = `translateX(${touchDeltaX.current}px)`;
      cardRef.current.style.opacity = opacity;
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 80) {
      dismiss();
    } else if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.style.opacity = '';
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <div
      ref={cardRef}
      role="alert"
      aria-live="assertive"
      className={`campusin-toast-card ${exiting ? 'campusin-toast-exit' : 'campusin-toast-enter'}`}
      style={{
        '--toast-color': config.color,
        '--toast-bg': config.bg,
        '--toast-border': config.border,
        '--toast-icon-bg': config.iconBg,
      }}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Icon */}
      <div className="campusin-toast-icon-wrap">
        <Icon size={20} strokeWidth={2.2} color={config.color} />
      </div>

      {/* Content */}
      <div className="campusin-toast-body">
        <span className="campusin-toast-title">{t.title || t.message}</span>
        {t.description && (
          <span className="campusin-toast-desc">{t.description}</span>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        className="campusin-toast-close"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        aria-label="Dismiss notification"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ─── Provider ─── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', description = '') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => {
      const next = [...prev, { id, message, type, title: message, description }];
      // Cap to MAX_VISIBLE, remove oldest
      if (next.length > MAX_VISIBLE) return next.slice(next.length - MAX_VISIBLE);
      return next;
    });
  }, []);

  const success = useCallback((msg, desc) => showToast(msg, 'success', desc), [showToast]);
  const error = useCallback((msg, desc) => showToast(msg, 'error', desc), [showToast]);
  const warning = useCallback((msg, desc) => showToast(msg, 'warning', desc), [showToast]);
  const info = useCallback((msg, desc) => showToast(msg, 'info', desc), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Toast Portal */}
      <div className="campusin-toast-portal" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
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
