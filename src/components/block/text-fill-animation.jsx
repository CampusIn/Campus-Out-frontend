'use client';

import { useEffect, useId, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitText from 'gsap/SplitText';
import { cn } from '../../lib/utils';
import './text-fill-animation.css';

const SPLIT_CHARACTER_SELECTOR = '.split-chars';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * @param {{
 *   text?: string, textColor?: string, primaryColor?: string, dimColor?: string,
 *   backgroundColor?: string, className?: string, id?: string,
 *   textSize?: string, textWidth?: string, containerClassName?: string,
 *   mobileTextSize?: string, mobileTextWidth?: string,
 *   tabletTextSize?: string, tabletTextWidth?: string,
 *   scroller?: HTMLElement | Window | import('react').RefObject<HTMLElement | null>,
 *   trigger?: HTMLElement | import('react').RefObject<HTMLElement | null>,
 *   start?: string, end?: string, scrub?: number | boolean,
 *   height?: string | number, viewportHeight?: string, showDetails?: boolean,
 *   style?: import('react').CSSProperties
 * }} props
 */
export function TextFillAnimation({
  text = 'Build thoughtful interfaces, bring your ideas to life, and make every interaction feel right.',
  textColor = '#111111',
  primaryColor = '#4A35E8',
  dimColor = '#e2e2e6',
  backgroundColor = '#fdfdfd',
  className = '',
  id,
  textSize = '5vw',
  textWidth = '80%',
  containerClassName = '',
  mobileTextSize = '8vw',
  mobileTextWidth = '95%',
  tabletTextSize = '6.5vw',
  tabletTextWidth = '88%',
  scroller,
  trigger,
  start = 'top top',
  end = 'bottom bottom',
  scrub = 0.25,
  height = '250vh',
  viewportHeight = '100vh',
  showDetails = true,
  style,
}) {
  // State and refs
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const generatedId = useId();

  // Effects
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const textElement = textRef.current;

      if (!textElement) {
        return;
      }

      const split = SplitText.create(textElement, {
        type: 'words chars',
        aria: 'auto',
        tag: 'span',
        charsClass: 'split-chars',
      });

      gsap.set(textElement, {
        opacity: 1,
      });

      const characters = Array.from(
        textElement.querySelectorAll(SPLIT_CHARACTER_SELECTOR)
      );

      gsap
        .timeline({
          scrollTrigger: {
            trigger: (trigger?.current !== undefined ? trigger.current : trigger) ?? sectionRef.current,
            scroller: scroller?.current !== undefined ? scroller.current : scroller,
            start,
            end,
            scrub,
            invalidateOnRefresh: true,
          },
        })
        .to(
          characters,
          {
            className: 'split-chars show',
            duration: 0.4,
            stagger: 0.05,
            ease: 'power2.inOut',
          },
          0
        );

      return () => {
        split.revert();
      };
    }, sectionRef);

    return () => {
      media.revert();
    };
  }, [
    text,
    trigger,
    scroller,
    start,
    end,
    scrub,
  ]);

  // Return
  return (
    <section
      id={id ?? `obsidian-text-fill-${generatedId}`}
      ref={sectionRef}
      className={cn('obsidian-text-fill', containerClassName)}
      style={{
        backgroundColor,
        height,
        '--tfa-viewport-height': viewportHeight,
        '--tfa-text-color': textColor,
        '--tfa-primary-color': primaryColor,
        '--tfa-dim-color': dimColor,
        '--tfa-text-size': textSize,
        '--tfa-text-width': textWidth,
        '--tfa-tablet-text-size': tabletTextSize,
        '--tfa-tablet-text-width': tabletTextWidth,
        '--tfa-mobile-text-size': mobileTextSize,
        '--tfa-mobile-text-width': mobileTextWidth,
        ...style,
      }}
    >
      <div className="tfa-viewport">
        <div aria-hidden="true" className="tfa-glow" />

        {showDetails && (
          <>
            <div className="tfa-detail tfa-detail--top-left">
              <p>Design Philosophy</p>
            </div>

            <div className="tfa-detail tfa-detail--top-right">
              <p>Scroll ↓</p>
            </div>

            <div className="tfa-detail tfa-detail--bottom-left">
              <p>
                Less friction.
                <br />
                More building.
              </p>
            </div>

            <div className="tfa-detail tfa-detail--bottom-right">
              <div className="tfa-detail-stack">
                <p>Systems</p>
                <p>Motion</p>
                <p>Clarity</p>
              </div>
            </div>
          </>
        )}

        <div className="tfa-text-wrapper">
          <h2 ref={textRef} className={cn('tfa-heading', className)}>
            {text}
          </h2>
        </div>
      </div>
    </section>
  );
}
