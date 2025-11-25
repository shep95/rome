import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseVoiceRecordingProps {
  onRecordingComplete: (audioBlob: Blob, duration: number, waveformData: number[]) => void;
  maxDuration?: number; // in seconds
}

export const useVoiceRecording = ({ 
  onRecordingComplete, 
  maxDuration = 300 
}: UseVoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout>();

  const captureWaveform = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average amplitude
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalized = average / 255; // Normalize to 0-1
    
    setWaveformData(prev => [...prev.slice(-50), normalized]); // Keep last 50 samples
    
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(captureWaveform);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Setup audio context for waveform visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordingDuration = duration;
        const finalWaveform = [...waveformData];
        
        onRecordingComplete(audioBlob, recordingDuration, finalWaveform);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);
      setWaveformData([]);

      // Start duration timer
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        
        if (elapsed >= maxDuration) {
          stopRecording();
          toast.info(`Maximum recording duration (${maxDuration}s) reached`);
        }
      }, 100);

      // Start waveform capture
      captureWaveform();

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      audioChunksRef.current = [];
      stopRecording();
      setDuration(0);
      setWaveformData([]);
      toast.info('Recording cancelled');
    }
  };

  return {
    isRecording,
    duration,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording
  };
};
