"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollDownButtonProps {
  targetId: string;
  className?: string;
}

export const ScrollDownButton = ({ targetId, className }: ScrollDownButtonProps) => {
  const handleScroll = () => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <motion.button
      onClick={handleScroll}
      className={cn(
        "relative group flex items-center justify-center",
        "w-12 h-12 sm:w-14 sm:h-14",
        "rounded-xl border border-primary/20",
        "bg-background/80 backdrop-blur-sm",
        "hover:bg-primary/10 hover:border-primary/40",
        "transition-all duration-300 ease-out",
        "shadow-lg hover:shadow-xl",
        "before:absolute before:inset-0 before:rounded-xl",
        "before:bg-gradient-to-br before:from-primary/20 before:to-transparent",
        "before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        className
      )}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 0 25px hsl(var(--primary) / 0.3)"
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      aria-label="Scroll to next section"
    >
      <motion.div
        animate={{ 
          y: [0, 4, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10"
      >
        <ChevronDown 
          className="w-5 h-5 sm:w-6 sm:h-6 text-primary/80 group-hover:text-primary transition-colors" 
        />
      </motion.div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
    </motion.button>
  );
};