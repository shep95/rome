"use client";

import { motion } from "framer-motion";
import { SpotlightButton } from "@/components/ui/spotlight-button";
import { ScrollDownButton } from "@/components/ui/scroll-down-button";

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(171,144,105,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="#ab9069"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

interface BackgroundPathsProps {
    title?: string;
    onSignUpClick?: () => void;
}

export function BackgroundPaths({
    title = "Background Paths",
    onSignUpClick,
}: BackgroundPathsProps) {
    const words = title.split(" ");

    return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background">
            {/* Top Left Logo */}
            <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
                <img 
                    src="/lovable-uploads/26b8c3f9-3d80-4cb9-befd-9949e4313547.png" 
                    alt="ROME Logo" 
                    className="w-8 h-8"
                />
                <span className="text-xl font-bold text-foreground">ROME</span>
            </div>

            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center mt-16 sm:mt-20">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-4 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.1 +
                                                letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-foreground to-foreground/80"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground mb-8 px-4"
                    >
                        Advance Secured Messaging App | Powered By Zorak Corp
                    </motion.div>
                </motion.div>
            </div>
            
            {/* Scroll Down Button */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                <ScrollDownButton targetId="marquee-section" />
            </div>
            
            {/* Watermark */}
            <div className="fixed bottom-4 right-4 z-30">
                <img 
                    src="/lovable-uploads/c0adbdf1-7e12-4f03-bc2c-96a8a62eb425.png" 
                    alt="ROME Logo" 
                    className="w-16 h-16 rounded-xl opacity-80 hover:opacity-100 transition-opacity"
                />
            </div>
        </div>
    );
}