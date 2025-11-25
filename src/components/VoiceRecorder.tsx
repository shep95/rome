import { Mic, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number, waveformData: number[]) => void;
  className?: string;
}

export const VoiceRecorder = ({ onRecordingComplete, className }: VoiceRecorderProps) => {
  const { 
    isRecording, 
    duration, 
    waveformData, 
    startRecording, 
    stopRecording, 
    cancelRecording 
  } = useVoiceRecording({ onRecordingComplete });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={startRecording}
        className={cn("hover:bg-primary/10", className)}
        title="Record voice message"
      >
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 bg-primary/5 rounded-lg px-4 py-2", className)}>
      {/* Waveform visualization */}
      <div className="flex items-center gap-0.5 h-8">
        {waveformData.slice(-20).map((amplitude, i) => (
          <div
            key={i}
            className="w-1 bg-primary rounded-full transition-all duration-100"
            style={{
              height: `${Math.max(4, amplitude * 32)}px`
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <span className="text-sm font-mono text-foreground/70 min-w-[3rem]">
        {formatDuration(duration)}
      </span>

      {/* Recording indicator */}
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs text-muted-foreground">Recording</span>
      </div>

      {/* Controls */}
      <div className="flex gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={cancelRecording}
          className="h-8 w-8 hover:bg-destructive/10"
          title="Cancel recording"
        >
          <X className="h-4 w-4 text-destructive" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={stopRecording}
          className="h-8 w-8"
          title="Stop and send"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
