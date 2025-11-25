import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration: number;
  waveformData?: number[];
  className?: string;
}

export const VoiceMessagePlayer = ({ 
  audioUrl, 
  duration, 
  waveformData = [],
  className 
}: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2 min-w-[200px]", className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        className="h-8 w-8 shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Waveform visualization */}
      <div className="flex-1 relative h-8 flex items-center gap-0.5">
        {waveformData.length > 0 ? (
          waveformData.map((amplitude, i) => {
            const barProgress = (i / waveformData.length) * 100;
            const isPlayed = barProgress <= progress;
            
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors",
                  isPlayed ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{
                  height: `${Math.max(4, amplitude * 24)}px`
                }}
              />
            );
          })
        ) : (
          // Fallback to simple progress bar if no waveform data
          <div className="w-full h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Time display */}
      <span className="text-xs font-mono text-muted-foreground shrink-0 min-w-[2.5rem]">
        {formatTime(isPlaying ? currentTime : duration)}
      </span>
    </div>
  );
};
