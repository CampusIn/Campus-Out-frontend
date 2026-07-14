import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

// Global state for toasts
let counter = 0;
let records = [];
const listeners = new Set();

function emit() {
  for (const l of listeners) l(records);
}

function addToast(options) {
  const id = ++counter;
  records = [{ id, variant: "default", ...options }, ...records];
  emit();
  return id;
}

function dismissToast(id) {
  records = records.filter((r) => r.id !== id);
  emit();
}

const GAP = 14; 
const PEEK = 16; 
const SCALE_STEP = 0.05; 
const MAX_VISIBLE = 3; 

const TOAST_SPRING = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

function ToastItem({ record, index, total, expanded, isBottom, expandedOffset, onHeight, defaultDuration }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => onHeight(record.id, el.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [record.id, onHeight]);

  useEffect(() => {
    if (expanded) return;
    const id = setTimeout(() => dismissToast(record.id), record.duration ?? defaultDuration);
    return () => clearTimeout(id);
  }, [expanded, record.id, record.duration, defaultDuration]);

  const handleDragEnd = (_e, info) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) {
      dismissToast(record.id);
    }
  };

  const dir = isBottom ? -1 : 1; 
  const hidden = !expanded && index >= MAX_VISIBLE;

  const y = expanded ? dir * expandedOffset : dir * index * PEEK;
  const scale = expanded ? 1 : Math.max(0, 1 - index * SCALE_STEP);

  const variantClass = record.variant === 'success' ? 'godui-toast-success' : 
                       record.variant === 'error' ? 'godui-toast-error' : 
                       record.variant === 'warning' ? 'godui-toast-warning' :
                       'godui-toast-default';

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: dir * -40, scale: 0.9 }}
      animate={{ opacity: hidden ? 0 : 1, y, scale }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={TOAST_SPRING}
      drag={hidden ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={{
        zIndex: total - index,
        transformOrigin: isBottom ? "bottom center" : "top center",
        pointerEvents: hidden ? "none" : "auto",
        position: 'absolute',
        left: 0,
        right: 0,
        ...(isBottom ? { bottom: 0 } : { top: 0 })
      }}
      className={`godui-toast-item ${variantClass}`}
    >
      <div className="godui-toast-content">
        {record.title && <div className="godui-toast-title">{record.title}</div>}
        {record.description && <div className="godui-toast-desc">{record.description}</div>}
      </div>
    </motion.li>
  );
}

export function ToastProvider({ children, position = "bottom-center", duration = 4000 }) {
  const [items, setItems] = useState(records);
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    listeners.add(setItems);
    setItems(records);
    return () => listeners.delete(setItems);
  }, []);

  useEffect(() => {
    setHeights((prev) => {
      const next = {};
      let changed = false;
      for (const item of items) {
        if (prev[item.id] != null) next[item.id] = prev[item.id];
      }
      for (const key of Object.keys(prev)) {
        if (next[Number(key)] == null) changed = true;
      }
      return changed ? next : prev;
    });
  }, [items]);

  const setHeight = useCallback((id, height) => {
    setHeights((prev) => prev[id] === height ? prev : { ...prev, [id]: height });
  }, []);

  const showToast = useCallback((message, type = 'info', description = '') => {
    addToast({ title: message, description, variant: type });
  }, []);

  const success = useCallback((msg, desc) => showToast(msg, 'success', desc), [showToast]);
  const error = useCallback((msg, desc) => showToast(msg, 'error', desc), [showToast]);
  const warning = useCallback((msg, desc) => showToast(msg, 'warning', desc), [showToast]);
  const info = useCallback((msg, desc) => showToast(msg, 'info', desc), [showToast]);

  const isBottom = position.startsWith("bottom");

  const offsets = [];
  let running = 0;
  for (let i = 0; i < items.length; i++) {
    offsets.push(running);
    running += (heights[items[i].id] ?? 0) + GAP;
  }

  const frontHeight = items.length ? (heights[items[0].id] ?? 0) : 0;
  const totalHeight = running > 0 ? running - GAP : 0;
  const collapsedHeight = frontHeight + Math.min(items.length - 1, MAX_VISIBLE - 1) * PEEK;
  const regionHeight = Math.max(0, expanded ? totalHeight : collapsedHeight);

  // Position class logic
  const posClass = position === 'bottom-center' ? 'godui-toast-bottom-center' : 'godui-toast-bottom-right';

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {mounted && typeof document !== 'undefined' && createPortal(
        <motion.ol
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          animate={{ height: regionHeight }}
          transition={TOAST_SPRING}
          style={{ transformOrigin: isBottom ? "bottom" : "top" }}
          className={`godui-toaster ${items.length ? 'active' : ''} ${posClass}`}
        >
          <AnimatePresence initial={false}>
            {items.map((record, index) => (
              <ToastItem
                key={record.id}
                record={record}
                index={index}
                total={items.length}
                expanded={expanded}
                isBottom={isBottom}
                expandedOffset={offsets[index]}
                onHeight={setHeight}
                defaultDuration={duration}
              />
            ))}
          </AnimatePresence>
        </motion.ol>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
