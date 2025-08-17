"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const ThreeDMarquee = ({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) => {
  // Split the images array into 6 equal parts for better coverage
  const chunkSize = Math.ceil(images.length / 6);
  const chunks = Array.from({ length: 6 }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return images.slice(start, start + chunkSize);
  });
  
  return (
    <div className={cn("w-full h-screen overflow-hidden", className)}>
      <div className="w-full h-full flex items-center justify-center">
        {/* Background scattered images */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => (
            <img
              key={`bg-${i}`}
              src={images[i % images.length]}
              alt=""
              className="absolute w-20 h-16 rounded object-cover opacity-20"
              style={{
                left: `${(i * 8) + 5}%`,
                top: `${(i * 6) + 10}%`,
                transform: `rotate(${i * 25}deg) scale(0.8)`,
                zIndex: 0
              }}
            />
          ))}
        </div>
        
        <div
          style={{
            transform: "rotateX(45deg) rotateY(0deg) rotateZ(-35deg)",
            transformStyle: "preserve-3d",
            zIndex: 10
          }}
          className="grid grid-cols-6 gap-4 w-[1400px] h-[1000px] -mt-20 relative"
        >
          {chunks.map((subarray, colIndex) => (
            <motion.div
              animate={{ 
                y: colIndex % 2 === 0 ? [0, 50, 0] : [0, -50, 0] 
              }}
              transition={{
                duration: colIndex % 2 === 0 ? 12 : 16,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              key={colIndex + "marquee"}
              className="flex flex-col gap-4"
            >
              {subarray.map((image, imageIndex) => (
                <motion.img
                  whileHover={{
                    scale: 1.05,
                    z: 50,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                  key={imageIndex + image}
                  src={image}
                  alt={`Image ${imageIndex + 1}`}
                  className="w-full h-32 rounded-lg object-cover shadow-lg hover:shadow-2xl"
                  loading="lazy"
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