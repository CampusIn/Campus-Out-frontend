import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";

const SIZES = {
  compact: { width: 140, height: 36, radius: 18 },
  default: { width: 220, height: 44, radius: 22 },
  long: { width: 360, height: 52, radius: 26 },
  tall: { width: 260, height: 120, radius: 28 },
  large: { width: 360, height: 200, radius: 36 },
};

const SHELL_SPRING = {
  type: "spring",
  stiffness: 520,
  damping: 32,
};

const DynamicIsland = React.forwardRef(
  (
    { size = "default", presenceKey, className, style, children, ...props },
    ref,
  ) => {
    const reduceMotion = useReducedMotion();
    const dims = SIZES[size];
    const key = presenceKey ?? size;

    return (
      <motion.div
        ref={ref}
        data-slot="dynamic-island"
        layout
        initial={false}
        animate={{
          width: dims.width,
          height: dims.height,
          borderRadius: dims.radius,
        }}
        transition={reduceMotion ? { duration: 0 } : SHELL_SPRING}
        className={className}
        style={{ 
          maxWidth: "100%", 
          background: '#ffffff', 
          color: '#1a1a1a', 
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -5px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          margin: '0 auto',
          border: '1px solid #f0f0f0',
          ...style 
        }}
        {...props}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={key}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, scale: 0.9, filter: "blur(4px)" }
            }
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, scale: 0.9, filter: "blur(4px)" }
            }
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  },
);
DynamicIsland.displayName = "DynamicIsland";

export { DynamicIsland };
