"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export const ThreeDMarquee = ({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) => {
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Adjust chunk size based on screen size for better mobile experience
  const getChunkConfig = () => {
    if (windowSize.width < 640) return { columns: 3, chunkSize: Math.ceil(images.length / 3) };
    if (windowSize.width < 768) return { columns: 4, chunkSize: Math.ceil(images.length / 4) };
    return { columns: 6, chunkSize: Math.ceil(images.length / 6) };
  };

  const { columns, chunkSize } = getChunkConfig();
  const chunks = Array.from({ length: columns }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return images.slice(start, start + chunkSize);
  });
  
  return (
    <div className={cn("w-full h-screen overflow-hidden touch-pan-y", className)}>
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="grid gap-2 sm:gap-3 md:gap-4 w-[280px] sm:w-[600px] md:w-[1000px] lg:w-[1400px] h-[400px] sm:h-[600px] md:h-[800px] lg:h-[1000px] -mt-10 sm:-mt-15 md:-mt-20"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            transform: "rotateX(45deg) rotateY(0deg) rotateZ(-35deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {chunks.map((subarray, colIndex) => (
            <motion.div
              animate={{ 
                y: colIndex % 2 === 0 ? [0, 30, 0] : [0, -30, 0] 
              }}
              transition={{
                duration: colIndex % 2 === 0 ? 8 : 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              key={colIndex + "marquee"}
              className="flex flex-col gap-2 sm:gap-3 md:gap-4"
            >
              {subarray.map((image, imageIndex) => (
                <motion.img
                  whileHover={{
                    scale: 1.05,
                    z: 50,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  key={imageIndex + image}
                  src={image}
                  alt={`Image ${imageIndex + 1}`}
                  className="w-full h-20 sm:h-24 md:h-28 lg:h-32 rounded-md sm:rounded-lg object-cover shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl will-change-transform"
                  loading="lazy"
                  draggable={false}
                  style={{
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    WebkitTouchCallout: 'none',
                  }}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

const GridLineVertical = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};