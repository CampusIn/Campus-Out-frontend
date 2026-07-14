import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";

const RevealContext = React.createContext(null);
const CardIndexContext = React.createContext(null);

const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

const FADE_TRANSITION = { duration: 0.2, ease: [0.65, 0, 0.35, 1] };
const COLLAPSED_RADIUS = 9999;
const EXPANDED_RADIUS = 20;
const EXPANDED_WIDTH = "100%";
const COLLAPSED_BASE_WIDTH = 90;
const COLLAPSED_WIDTH_STEP = 7;
const COLLAPSED_MIN_WIDTH = 60;
const HOVER_SCALE = 1.03;

function collapsedWidth(distance) {
  const base = COLLAPSED_BASE_WIDTH - (distance - 1) * COLLAPSED_WIDTH_STEP;
  const width = Math.max(base, COLLAPSED_MIN_WIDTH);
  return `${width}%`;
}

function CardCollapsed({ children }) {
  return null;
}
CardCollapsed.displayName = "ProgressiveCardReveal.CardCollapsed";

function CardExpanded({ children }) {
  return null;
}
CardExpanded.displayName = "ProgressiveCardReveal.CardExpanded";

function extractSlots(children) {
  let collapsed = null;
  let expanded = null;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }
    if (child.type === CardCollapsed || child.type?.displayName === 'ProgressiveCardReveal.CardCollapsed') {
      collapsed = child.props.children;
    } else if (child.type === CardExpanded || child.type?.displayName === 'ProgressiveCardReveal.CardExpanded') {
      expanded = child.props.children;
    }
  });
  return { collapsed, expanded };
}

const Card = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const reveal = React.useContext(RevealContext);
    const index = React.useContext(CardIndexContext);
    const reducedMotion = useReducedMotion() ?? false;

    if (reveal === null || index === null) {
      throw new Error(
        "ProgressiveCardReveal.Card must be rendered inside <ProgressiveCardReveal>.",
      );
    }

    const expanded = index === reveal.activeIndex;
    const distance = Math.abs(index - reveal.activeIndex);
    const depth = reveal.maxDepth != null ? Math.min(distance, reveal.maxDepth) : distance;
    const { collapsed, expanded: expandedView } = extractSlots(children);

    return (
      <motion.div
        ref={ref}
        layout={!reducedMotion}
        data-expanded={expanded}
        initial={false}
        transition={reducedMotion ? { duration: 0 } : LAYOUT_TRANSITION}
        whileHover={reducedMotion || expanded ? undefined : { scale: HOVER_SCALE }}
        style={{
          width: expanded ? EXPANDED_WIDTH : collapsedWidth(depth),
          borderRadius: expanded ? EXPANDED_RADIUS : COLLAPSED_RADIUS,
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid #e2e8f0', // thicker border for coupons
          background: '#ffffff',
          color: '#1a202c',
          boxShadow: expanded ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
          willChange: 'transform',
          ...props.style
        }}
        className={className}
        {...props}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {expanded ? (
            <motion.div
              key="expanded"
              layout={reducedMotion ? false : "position"}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reducedMotion ? { duration: 0 } : FADE_TRANSITION}
              style={{ padding: '16px 20px' }}
            >
              {expandedView}
            </motion.div>
          ) : (
            <motion.button
              key="collapsed"
              type="button"
              layout={reducedMotion ? false : "position"}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={reducedMotion ? { duration: 0 } : FADE_TRANSITION}
              onClick={() => reveal.onActiveChange?.(index)}
              aria-expanded={false}
              style={{
                display: 'block',
                width: '100%',
                cursor: 'pointer',
                padding: '8px 20px',
                textAlign: 'left',
                fontSize: '0.875rem',
                outline: 'none',
                background: 'transparent',
                border: 'none',
                color: 'inherit'
              }}
            >
              {collapsed}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);
Card.displayName = "ProgressiveCardReveal.Card";

const Root = React.forwardRef(
  (
    { activeIndex, onActiveChange, maxDepth, children, className, style, ...props },
    ref,
  ) => {
    const contextValue = React.useMemo(
      () => ({ activeIndex, onActiveChange, maxDepth }),
      [activeIndex, onActiveChange, maxDepth],
    );

    let cardIndex = 0;
    const indexedChildren = React.Children.map(children, (child) => {
      if (
        React.isValidElement(child) && 
        (child.type === Card || child.type?.displayName === 'ProgressiveCardReveal.Card')
      ) {
        const index = cardIndex;
        cardIndex += 1;
        return (
          <CardIndexContext.Provider value={index}>
            {child}
          </CardIndexContext.Provider>
        );
      }
      return child;
    });

    return (
      <RevealContext.Provider value={contextValue}>
        <div
          ref={ref}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', ...style }}
          className={className}
          {...props}
        >
          {indexedChildren}
        </div>
      </RevealContext.Provider>
    );
  },
);
Root.displayName = "ProgressiveCardReveal";

const ProgressiveCardReveal = Object.assign(Root, {
  Card,
  CardCollapsed,
  CardExpanded,
});

export { ProgressiveCardReveal };
