import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { createPortal } from "react-dom";

const MorphingDialogContext = React.createContext(null);

function useMorphingDialog() {
  const ctx = React.useContext(MorphingDialogContext);
  if (!ctx) {
    throw new Error(
      "MorphingDialog components must be used within <MorphingDialog>.",
    );
  }
  return ctx;
}

const MORPH_SPRING = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

function MorphingDialog({ children, open, onOpenChange }) {
  const reduceMotion = useReducedMotion() ?? false;
  const layoutId = React.useId();
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const isOpen = open ?? uncontrolled;

  const setOpen = React.useCallback(
    (next) => {
      if (open === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  const value = React.useMemo(
    () => ({
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      layoutId: `morphing-dialog-${layoutId}`,
      reduceMotion,
    }),
    [isOpen, setOpen, layoutId, reduceMotion],
  );

  return (
    <MorphingDialogContext.Provider value={value}>
      {children}
    </MorphingDialogContext.Provider>
  );
}

const MorphingDialogTrigger = React.forwardRef(
  ({ className, children, onClick, onKeyDown, ...props }, ref) => {
    const { open, layoutId, isOpen } = useMorphingDialog();
    return (
      <motion.div
        ref={ref}
        data-slot="morphing-dialog-trigger"
        layoutId={layoutId}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={(e) => {
          onClick?.(e);
          open();
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        className={`cursor-pointer ${className ?? ""}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
MorphingDialogTrigger.displayName = "MorphingDialogTrigger";

const MorphingDialogContent = React.forwardRef(
  ({ className, style, children, ...props }, ref) => {
    const { isOpen, close, layoutId, reduceMotion } = useMorphingDialog();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    React.useEffect(() => {
      if (!isOpen) return;
      const onKey = (e) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }, [isOpen, close]);

    if (!mounted) return null;

    return createPortal(
      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 grid place-items-center p-4" style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'grid', placeItems: 'center', padding: '16px' }}>
            <motion.button
              type="button"
              aria-label="Dismiss dialog"
              data-slot="morphing-dialog-backdrop"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, border: 'none', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              ref={ref}
              data-slot="morphing-dialog-content"
              role="dialog"
              aria-modal="true"
              layoutId={layoutId}
              transition={reduceMotion ? { duration: 0 } : MORPH_SPRING}
              className={`relative overflow-hidden bg-white shadow-2xl ${className ?? ""}`}
              style={{ position: 'relative', zIndex: 10000, overflow: 'hidden', background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: '24px', ...style }}
              {...props}
            >
              {children}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>,
      document.body,
    );
  },
);
MorphingDialogContent.displayName = "MorphingDialogContent";

const MorphingDialogClose = React.forwardRef(
  ({ className, children, onClick, ...props }, ref) => {
    const { close } = useMorphingDialog();
    return (
      <motion.button
        ref={ref}
        type="button"
        data-slot="morphing-dialog-close"
        aria-label="Close dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        onClick={(e) => {
          onClick?.(e);
          close();
        }}
        className={`absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-black/10 text-black/70 hover:bg-black/20 hover:text-black ${className ?? ""}`}
        style={{ position: 'absolute', right: '16px', top: '16px', width: '32px', height: '32px', display: 'grid', placeItems: 'center', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.5)', cursor: 'pointer', zIndex: 10001 }}
        {...props}
      >
        {children ?? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ width: '16px', height: '16px' }}
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        )}
      </motion.button>
    );
  },
);
MorphingDialogClose.displayName = "MorphingDialogClose";

export {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContent,
  MorphingDialogTrigger,
};
