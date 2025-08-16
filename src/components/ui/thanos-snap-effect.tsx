/** 
 * Highly inspired by Mikhail Bespalov's codepen
 * https://codepen.io/Mikhail-Bespalov/pen/yLmpxOG
*/

import React, { useRef, type PropsWithChildren } from 'react';
import {
  m,
  useAnimate,
  useMotionValue,
  useMotionValueEvent,
} from 'motion/react';

const DURATION_SECONDS = 0.6;
const MAX_DISPLACEMENT = 300;
const OPACITY_CHANGE_START = 0.5;
const transition = {
  duration: DURATION_SECONDS,
  ease: (time: number) => 1 - Math.pow(1 - time, 3),
};

interface ThanosSnapEffectProps extends PropsWithChildren {
  onAnimationComplete?: () => void;
  trigger?: boolean;
}

export function ThanosSnapEffect({ children, onAnimationComplete, trigger }: ThanosSnapEffectProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const displacementMapRef = useRef<SVGFEDisplacementMapElement>(null);
  const dissolveTargetRef = useRef<HTMLDivElement>(null);
  const displacement = useMotionValue(0);

  useMotionValueEvent(displacement, "change", (latest) => {
    displacementMapRef.current?.setAttribute('scale', latest.toString());
  });

  const handleSnap = async () => {
    if (scope.current?.dataset.isAnimating === 'true') return;
    if (scope.current) scope.current.dataset.isAnimating = 'true';

    await Promise.all([
      animate(
        dissolveTargetRef.current!,
        { scale: 1.2, opacity: [1, 1, 0] },
        { ...transition, times: [0, OPACITY_CHANGE_START, 1] }
      ),
      animate(displacement, MAX_DISPLACEMENT, transition)
    ]);

    // Call completion callback after animation
    onAnimationComplete?.();

    setTimeout(() => {
      if (dissolveTargetRef.current) {
        animate(dissolveTargetRef.current, { scale: 1, opacity: 1 }, { duration: 0 });
      }
      displacement.set(0);
      if (scope.current) scope.current.dataset.isAnimating = 'false';
    }, 500);
  };

  // Auto-trigger animation when trigger prop changes to true
  React.useEffect(() => {
    if (trigger) {
      handleSnap();
    }
  }, [trigger]);

  return (
    <div ref={scope}>
      <m.div
        ref={dissolveTargetRef}
        onClick={handleSnap}
        className="cursor-pointer filter-[url(#dissolve-filter)]"
      >
        {children}
      </m.div>

      <svg width="0" height="0" className="absolute -z-1">
        <defs>
          <filter
            id="dissolve-filter"
            x="-300%"
            y="-300%"
            width="600%"
            height="600%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="1"
              result="bigNoise"
            />
            <feComponentTransfer
              in="bigNoise"
              result="bigNoiseAdjusted"
            >
              <feFuncR type="linear" slope="0.5" intercept="-0.2" />
              <feFuncG type="linear" slope="3" intercept="-0.6" />
            </feComponentTransfer>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1"
              numOctaves="2"
              result="fineNoise"
            />
            <feMerge result="combinedNoise">
              <feMergeNode in="bigNoiseAdjusted" />
              <feMergeNode in="fineNoise" />
            </feMerge>
            <feDisplacementMap
              ref={displacementMapRef}
              in="SourceGraphic"
              in2="combinedNoise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
};