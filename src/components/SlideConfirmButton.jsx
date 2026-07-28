import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import React, { useState, useRef, useLayoutEffect } from "react";

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    style={{ width: '20px', height: '20px' }}
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const SlideConfirmButton = React.forwardRef(
  (
    {
      onConfirm,
      threshold = 0.8,
      confirmedLabel = "Confirmed",
      processingLabel = "Placing Order...",
      disabled = false,
      className = "",
      style = {},
      children,
      variant = "default", // "default" | "destructive"
      ...props
    },
    forwardedRef,
  ) => {
    const reduce = useReducedMotion() ?? false;
    const trackRef = useRef(null);
    const [maxX, setMaxX] = useState(0);
    const [status, setStatus] = useState("idle");
    const statusRef = useRef(status);
    statusRef.current = status;

    const x = useMotionValue(0);
    const labelOpacity = useTransform(x, [0, Math.max(1, maxX * 0.6)], [1, 0]);
    
    // Hardcode dimensions for simplicity
    const dims = { thumb: 44, pad: 4 };
    const fillWidth = useTransform(x, (v) => v + dims.thumb);

    useLayoutEffect(() => {
      const el = trackRef.current;
      if (!el) return;
      const measure = () => {
        const usable = el.clientWidth - dims.thumb - dims.pad * 2;
        setMaxX(Math.max(0, usable));
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [dims.thumb, dims.pad]);

    const confirm = async () => {
      if (statusRef.current === "processing" || statusRef.current === "confirmed") return;
      
      setStatus("processing");
      animate(x, maxX, { type: "spring", stiffness: 500, damping: 40 });
      
      let success = true;
      if (onConfirm) {
        try {
          const result = await onConfirm();
          if (result === false) {
            success = false;
          }
        } catch (e) {
          success = false;
        }
      }
      
      if (!success) {
        settleBack();
        setTimeout(() => {
          setStatus("idle");
        }, 400); // Delay so the spring back animation completes before drag is re-enabled
      } else {
        setStatus("confirmed");
      }
    };

    const settleBack = () => {
      animate(
        x,
        0,
        reduce
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 500, damping: 40 },
      );
    };

    const handleDragEnd = () => {
      if (statusRef.current === "confirmed") return;
      if (maxX > 0 && x.get() >= maxX * threshold) confirm();
      else settleBack();
    };

    const handleKeyDown = (event) => {
      if (disabled || statusRef.current === "confirmed") return;
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        confirm();
      }
    };

    const confirmed = status === "confirmed";
    const label = children || "Slide to confirm";

    const isDestructive = variant === "destructive";
    
    // Use solid colors to match the old HoldConfirmButton
    const trackBg = isDestructive ? "#b31522" : "#111111";
    const trackBorder = "transparent";
    const fillBg = "rgba(0, 0, 0, 0.25)"; // Darker fill trailing the thumb
    const textCol = "#ffffff";
    const thumbBg = "#ffffff";
    const thumbColor = isDestructive ? "#b31522" : "#111111";

    return (
      <div
        ref={forwardedRef}
        data-status={status}
        className={`slide-confirm-track ${className}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: '9999px',
          backgroundColor: trackBg,
          border: `1px solid ${trackBorder}`,
          height: '54px', // Match previous HoldConfirmButton height roughly
          width: '100%',
          userSelect: 'none',
          touchAction: 'none',
          pointerEvents: (disabled || status === 'processing' || status === 'confirmed') ? 'none' : 'auto',
          opacity: (disabled && status === 'idle') ? 0.6 : 1,
          ...style
        }}
        {...props}
      >
        <div ref={trackRef} style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />

        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            borderRadius: '9999px',
            backgroundColor: fillBg,
            top: dims.pad,
            bottom: dims.pad,
            left: dims.pad,
            width: fillWidth,
            display: confirmed ? 'none' : 'block'
          }}
        />

        <motion.span
          style={{ 
            opacity: confirmed ? 0 : labelOpacity,
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: textCol
          }}
        >
          {label}
        </motion.span>
        <style>{`
          @keyframes spin-button {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .btn-spinner {
            animation: spin-button 0.8s linear infinite;
          }
        `}</style>
        {confirmed && (
          <span 
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              color: '#ffffff'
            }}
          >
            {confirmedLabel}
          </span>
        )}
        {status === "processing" && (
          <span 
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              color: '#ffffff',
              gap: '8px'
            }}
          >
            <div className="btn-spinner" style={{
              width: '16px',
              height: '16px',
              border: '2.5px solid rgba(255, 255, 255, 0.2)',
              borderTop: '2.5px solid #ffffff',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <span>{processingLabel}</span>
          </span>
        )}

        <motion.button
          type="button"
          aria-label={typeof label === "string" ? label : "Slide to confirm"}
          disabled={disabled || status === "processing"}
          drag={confirmed || disabled || status === "processing" ? false : "x"}
          dragConstraints={{ left: 0, right: maxX }}
          dragElastic={0.04}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onKeyDown={handleKeyDown}
          style={{ 
            x, 
            width: dims.thumb, 
            height: dims.thumb, 
            margin: dims.pad,
            position: 'relative',
            zIndex: 20,
            display: 'inline-flex',
            flexShrink: 0,
            cursor: confirmed ? 'default' : 'grab',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            backgroundColor: confirmed ? '#ffffff' : thumbBg,
            color: confirmed ? thumbBg : thumbColor,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            border: 'none',
            outline: 'none',
          }}
          whileTap={{ cursor: "grabbing" }}
        >
          {confirmed ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              style={{ width: '20px', height: '20px' }}
              aria-hidden="true"
            >
              <motion.path
                d="M5 12.5 10 17.5 19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            </svg>
          ) : (
            <ArrowIcon />
          )}
        </motion.button>
      </div>
    );
  },
);
SlideConfirmButton.displayName = "SlideConfirmButton";

export { SlideConfirmButton };
