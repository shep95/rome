"use client";

import { motion } from "framer-motion";
import { SpotlightButton } from "@/components/ui/spotlight-button";
import { ScrollDownButton } from "@/components/ui/scroll-down-button";
import romeLandingBg from "@/assets/rome-landing-bg.png";
interface BackgroundPathsProps {
  title?: string;
  onSignUpClick?: () => void;
}
export function BackgroundPaths({
  title = "Background Paths",
  onSignUpClick
}: BackgroundPathsProps) {
  const words = title.split(" ");
  return <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background">
            {/* Film Grain Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-[1]" 
                 style={{
                   backgroundImage: `
                     radial-gradient(circle at 20% 80%, hsl(var(--primary)) 2px, transparent 2px),
                     radial-gradient(circle at 80% 20%, hsl(var(--accent)) 2px, transparent 2px),
                     radial-gradient(circle at 40% 40%, hsl(var(--muted-foreground)) 1px, transparent 1px),
                     radial-gradient(circle at 60% 60%, hsl(var(--primary)) 1px, transparent 1px)
                   `,
                   backgroundSize: '100px 100px, 80px 80px, 40px 40px, 60px 60px',
                   animation: 'grain 8s steps(10) infinite'
                 }}
            />
            {/* Social Links */}
            <div className="absolute top-4 sm:top-6 left-1/2 transform -translate-x-1/2 z-20 px-4 w-full max-w-sm">
                
            </div>

            {/* Hero Background Image */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                    className="w-full h-full"
                    style={{
                        backgroundImage: `url(${romeLandingBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                />
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-background/20" />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center mt-16 sm:mt-20">
                <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        duration: 2
      }} className="max-w-4xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tighter">
                        {words.map((word, wordIndex) => <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                                {word.split("").map((letter, letterIndex) => <motion.span key={`${wordIndex}-${letterIndex}`} initial={{
              y: 100,
              opacity: 0
            }} animate={{
              y: 0,
              opacity: 1
            }} transition={{
              delay: wordIndex * 0.1 + letterIndex * 0.03,
              type: "spring",
              stiffness: 150,
              damping: 25
            }} className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-foreground to-foreground/80">
                                        {letter}
                                    </motion.span>)}
                            </span>)}
                    </h1>

                    <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 1,
          duration: 1
        }} className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground mb-8 px-4">
                        Advance Secured Messaging App
                    </motion.div>
                </motion.div>
            </div>
            
            {/* Scroll Down Button */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                <ScrollDownButton targetId="marquee-section" />
            </div>
            
            {/* Watermark */}
            <div className="fixed bottom-4 right-4 z-30">
                <img src="/lovable-uploads/c0adbdf1-7e12-4f03-bc2c-96a8a62eb425.png" alt="ROME Logo" className="w-16 h-16 rounded-xl opacity-80 hover:opacity-100 transition-opacity" />
            </div>
        </div>;
}