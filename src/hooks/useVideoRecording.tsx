import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseVideoRecordingProps {
  onRecordingComplete: (videoBlob: Blob, duration: number, thumbnail?: string) => void;
  maxDuration?: number; // in seconds (default 30)
}

export const useVideoRecording = ({
  onRecordingComplete,
  maxDuration = 30
}: UseVideoRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [thumbnail, setThumbnail] = useState<string>();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const captureThumbnail = (stream: MediaStream): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      
      video.onloadedmetadata = () => {
        video.play();
        
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          video.srcObject = null;
          resolve(thumbnailUrl);
        }, 500);
      };
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;

      // Capture thumbnail
      const thumb = await captureThumbnail(stream);
      setThumbnail(thumb);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const recordingDuration = duration;
        
        onRecordingComplete(videoBlob, recordingDuration, thumbnail);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);

      // Start duration timer
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        
        if (elapsed >= maxDuration) {
          stopRecording();
          toast.info(`Maximum recording duration (${maxDuration}s) reached`);
        }
      }, 100);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access camera');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      videoChunksRef.current = [];
      stopRecording();
      setDuration(0);
      setThumbnail(undefined);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      toast.info('Recording cancelled');
    }
  };

  return {
    isRecording,
    duration,
    thumbnail,
    localStream: streamRef.current,
    startRecording,
    stopRecording,
    cancelRecording,
    videoPreviewRef
  };
};
