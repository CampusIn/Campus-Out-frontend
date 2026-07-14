import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';

const BlueprintGrid = forwardRef(({
  className,
  style,
  variant = "lines",
  cellSize = 32,
  color = "rgba(255, 255, 255, 0.15)", // Default for red background
  sweep = true,
  sweepDuration = 8,
  spotlight = true,
  spotlightColor = "rgba(255, 255, 255, 0.4)",
  spotlightRadius = 200,
  ...props
}, ref) => {
  const rootRef = useRef(null);
  useImperativeHandle(ref, () => rootRef.current);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !spotlight) return;
    const target = root.offsetParent ?? root;
    const onMove = (e) => {
      const rect = root.getBoundingClientRect();
      root.style.setProperty("--bx", `${e.clientX - rect.left}px`);
      root.style.setProperty("--by", `${e.clientY - rect.top}px`);
      root.style.setProperty("--bo", "0.55");
    };
    const onLeave = () => root.style.setProperty("--bo", "0");
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerleave", onLeave);
    return () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerleave", onLeave);
    };
  }, [spotlight]);

  const buildGrid = (c) =>
    variant === "dots"
      ? `radial-gradient(${c} 1px, transparent 1.5px)`
      : `linear-gradient(to right, ${c} 1px, transparent 1px), linear-gradient(to bottom, ${c} 1px, transparent 1px)`;
      
  const gridSize =
    variant === "dots"
      ? `${cellSize}px ${cellSize}px`
      : `${cellSize}px ${cellSize}px, ${cellSize}px ${cellSize}px`;

  const baseGrid = {
    backgroundImage: buildGrid(color),
    backgroundSize: gridSize,
  };

  const spotMask = `radial-gradient(circle ${spotlightRadius}px at var(--bx, 50%) var(--by, 50%), #000 0%, #000 35%, transparent 75%)`;
  const spotStyle = {
    backgroundImage: `radial-gradient(circle ${spotlightRadius}px at var(--bx, 50%) var(--by, 50%), color-mix(in oklab, ${spotlightColor}, transparent 90%), transparent 65%), ${buildGrid(`color-mix(in oklab, ${spotlightColor}, transparent 35%)`)}`,
    backgroundSize: `auto, ${gridSize}`,
    opacity: "var(--bo)",
    WebkitMaskImage: spotMask,
    maskImage: spotMask,
  };

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`godui-blueprint-grid ${className || ""}`}
      style={{
        "--bo": "0",
        ...style,
      }}
      {...props}
    >
      {variant === "perspective" ? (
        <div className="godui-blueprint-perspective-wrapper">
          <div
            className="godui-blueprint-perspective-floor"
            style={baseGrid}
          />
        </div>
      ) : (
        <div className="godui-blueprint-base" style={baseGrid} />
      )}

      {spotlight && variant !== "perspective" && (
        <div
          className="godui-blueprint-spotlight"
          style={spotStyle}
        />
      )}

      {sweep && (
        <div
          className="godui-blueprint-sweep"
          style={{
            "--blueprint-speed": `${sweepDuration}s`,
            backgroundImage: `linear-gradient(90deg, transparent, color-mix(in oklab, ${color}, transparent 20%), transparent)`,
            filter: "blur(14px)",
          }}
        />
      )}
    </div>
  );
});

BlueprintGrid.displayName = "BlueprintGrid";

export default BlueprintGrid;
