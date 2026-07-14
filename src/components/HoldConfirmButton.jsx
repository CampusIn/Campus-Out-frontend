import { animate, motion, useMotionValue } from "framer-motion";
import * as React from "react";

const BUTTON_BASE =
  "relative inline-flex cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-[var(--button-radius,12px)] font-medium [outline-offset:4px] [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [transition:scale_120ms_ease] active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

const variantClass = {
  destructive: "bg-[#b31522] text-white shadow-sm",
  default: "bg-primary text-primary-foreground shadow-sm",
};

const fillClass = {
  destructive: "bg-black/25",
  default: "bg-black/20",
};

const sizeClass = {
  sm: "[--button-radius:8px] px-3 py-1.5 text-sm",
  md: "[--button-radius:12px] px-4 py-2 text-base",
  lg: "[--button-radius:12px] px-6 py-3 text-lg",
};

const HoldConfirmButton = React.forwardRef(
  (
    {
      onConfirm,
      variant = "destructive",
      size = "md",
      duration = 900,
      holdingLabel = "Confirming…",
      confirmedLabel = "Confirmed",
      className = "",
      children = "Hold to confirm",
      disabled,
      onKeyDown,
      onKeyUp,
      ...props
    },
    forwardedRef,
  ) => {
    const [status, setStatus] = React.useState("idle");
    const statusRef = React.useRef(status);
    statusRef.current = status;

    const progress = useMotionValue(0);
    const playback = React.useRef(null);
    const resetTimer = React.useRef(undefined);
    const mounted = React.useRef(true);
    React.useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
        playback.current?.stop();
        clearTimeout(resetTimer.current);
      };
    }, []);

    const complete = async () => {
      if (!mounted.current) return;
      setStatus("processing");

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

      if (!mounted.current) return;

      if (!success) {
        setStatus("idle");
        animate(progress, 0, { duration: 0.2 });
        return;
      }

      setStatus("confirmed");
      resetTimer.current = setTimeout(() => {
        if (!mounted.current) return;
        setStatus("idle");
        animate(progress, 0, { duration: 0.2 });
      }, 2000);
    };

    const start = () => {
      if (statusRef.current !== "idle" || disabled) return;
      setStatus("holding");
      playback.current = animate(progress, 1, {
        duration: duration / 1000,
        ease: "linear",
        onComplete: complete,
      });
    };

    const cancel = () => {
      if (statusRef.current !== "holding") return;
      playback.current?.stop();
      setStatus("idle");
      animate(progress, 0, {
        type: "spring",
        stiffness: 320,
        damping: 32,
        mass: 0.9,
      });
    };

    const handleKeyDown = (event) => {
      onKeyDown?.(event);
      if ((event.key === " " || event.key === "Enter") && !event.repeat) {
        event.preventDefault();
        start();
      }
    };
    const handleKeyUp = (event) => {
      onKeyUp?.(event);
      if (event.key === " " || event.key === "Enter") cancel();
    };

    const label =
      status === "confirmed"
        ? confirmedLabel
        : status === "holding" || status === "processing"
          ? holdingLabel
          : children;

    return (
      <button
        ref={forwardedRef}
        type="button"
        data-status={status}
        aria-label={typeof children === "string" ? children : undefined}
        disabled={disabled}
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className={`${BUTTON_BASE} ${variantClass[variant]} ${status === "confirmed" ? "saturate-150" : ""} ${sizeClass[size]} ${className}`}
        {...props}
      >
        <motion.span
          aria-hidden="true"
          style={{ scaleX: progress }}
          className={`absolute inset-0 origin-left ${fillClass[variant]}`}
        />
        <span className="relative inline-flex items-center gap-2">
          {status === "confirmed" && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-[1.15em] h-[1.15em]"
              style={{ width: '1.15em', height: '1.15em' }}
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
          )}
          <span className="whitespace-nowrap">{label}</span>
        </span>
      </button>
    );
  },
);
HoldConfirmButton.displayName = "HoldConfirmButton";

export { HoldConfirmButton };
