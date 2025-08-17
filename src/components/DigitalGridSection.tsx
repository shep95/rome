import * as React from "react";

export const DigitalGridSection: React.FC = () => {
  const text = "Welcome To The Digital Grid";
  const letters = text.split("");

  return (
    <section className="relative bg-gradient-to-b from-primary/20 via-background to-background py-20 sm:py-32 md:py-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="relative flex items-center justify-center font-inter select-none">
            <div className="text-center">
              <div className="relative flex flex-wrap items-center justify-center gap-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
                {letters.map((letter, index) => (
                  <span
                    key={index}
                    className="inline-block text-foreground opacity-40 animate-loaderLetter"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </span>
                ))}
              </div>
              
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 rounded-full animate-loaderCircle border-4 border-primary/30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loaderCircle {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 6px 12px 0 hsl(var(--primary) / 0.3) inset,
              0 12px 18px 0 hsl(var(--primary) / 0.5) inset,
              0 36px 36px 0 hsl(var(--primary) / 0.2) inset,
              0 0 3px 1.2px hsl(var(--primary) / 0.4),
              0 0 6px 1.8px hsl(var(--primary) / 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 6px 12px 0 hsl(var(--primary) / 0.4) inset,
              0 12px 6px 0 hsl(var(--primary) / 0.6) inset,
              0 24px 36px 0 hsl(var(--primary) / 0.3) inset,
              0 0 3px 1.2px hsl(var(--primary) / 0.4),
              0 0 6px 1.8px hsl(var(--primary) / 0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 6px 12px 0 hsl(var(--primary) / 0.5) inset,
              0 12px 18px 0 hsl(var(--primary) / 0.4) inset,
              0 36px 36px 0 hsl(var(--primary) / 0.2) inset,
              0 0 3px 1.2px hsl(var(--primary) / 0.4),
              0 0 6px 1.8px hsl(var(--primary) / 0.2);
          }
        }

        @keyframes loaderLetter {
          0%,
          100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.15);
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }

        .animate-loaderCircle {
          animation: loaderCircle 5s linear infinite;
        }

        .animate-loaderLetter {
          animation: loaderLetter 3s infinite;
        }
      `}</style>
    </section>
  );
};