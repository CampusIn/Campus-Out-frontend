import canvasConfetti from 'canvas-confetti';
import * as React from 'react';

const DEFAULTS = {
  spread: 70,
  startVelocity: 45,
  particleCount: 120,
  origin: { y: 0.7 },
  disableForReducedMotion: true,
};

const Confetti = React.forwardRef(({ options }, ref) => {
  React.useImperativeHandle(
    ref,
    () => ({
      fire: (override) => {
        canvasConfetti({ ...DEFAULTS, ...options, ...override });
      },
    }),
    [options]
  );
  return null;
});
Confetti.displayName = 'Confetti';

function confetti(options) {
  canvasConfetti({ ...DEFAULTS, ...options });
}

export { Confetti, confetti };
