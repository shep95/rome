import { useEffect } from 'react';
import { Video, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVideoRecording } from '@/hooks/useVideoRecording';
import { cn } from '@/lib/utils';

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob, duration: number, thumbnail?: string) => void;
  maxDuration?: number;
  className?: string;
}

export const VideoRecorder = ({
  onRecordingComplete,
  maxDuration = 30,
  className
}: VideoRecorderProps) => {
  const {
    isRecording,
    duration,
    thumbnail,
    localStream,
    startRecording,
    stopRecording,
    cancelRecording,
    videoPreviewRef
  } = useVideoRecording({ onRecordingComplete, maxDuration });

  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream;
    }
  }, [localStream, videoPreviewRef]);

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
        title="Record video message"
      >
        <Video className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className={cn("p-4 space-y-3", className)}>
      {/* Video Preview */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoPreviewRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        
        {/* Recording indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">{formatDuration(duration)}</span>
        </div>

        {/* Duration limit indicator */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${(duration / maxDuration) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {maxDuration - duration}s remaining
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cancelRecording}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 mr-2" />
            Stop & Send
          </Button>
        </div>
      </div>
    </Card>
  );
};
