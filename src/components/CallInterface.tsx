import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWebRTC } from '@/hooks/useWebRTC';
import { cn } from '@/lib/utils';

interface CallInterfaceProps {
  conversationId: string;
  isVideo?: boolean;
  onEnd: () => void;
  otherUser?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

export const CallInterface = ({
  conversationId,
  isVideo = false,
  onEnd,
  otherUser
}: CallInterfaceProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const {
    isCallActive,
    isMuted,
    isVideoEnabled,
    localStream,
    remoteStream,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useWebRTC({ conversationId, isVideo });

  // Set up video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Start call on mount
  useEffect(() => {
    startCall(isVideo);
  }, []);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    endCall();
    onEnd();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Remote Video/Audio (Full Screen) */}
      <div className="flex-1 relative bg-black">
        {isVideo && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Avatar className="h-32 w-32 mx-auto">
                <AvatarImage src={otherUser?.avatar_url} />
                <AvatarFallback className="text-4xl">
                  {otherUser?.display_name?.[0] || otherUser?.username?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {otherUser?.display_name || otherUser?.username}
                </h2>
                <p className="text-white/70">
                  {isCallActive ? formatDuration(callDuration) : 'Connecting...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {isVideo && localStream && (
          <Card className={cn(
            "absolute top-4 right-4 w-48 h-36 overflow-hidden",
            !isVideoEnabled && "bg-black"
          )}>
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <VideoOff className="h-8 w-8 text-white" />
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-background/95 backdrop-blur-sm border-t">
        <div className="max-w-md mx-auto space-y-4">
          {/* Call Status */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isCallActive ? formatDuration(callDuration) : 'Connecting...'}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Mute/Unmute */}
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="h-14 w-14 rounded-full"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            {/* End Call */}
            <Button
              variant="destructive"
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            {/* Toggle Video (if video call) */}
            {isVideo && (
              <Button
                variant={!isVideoEnabled ? "destructive" : "secondary"}
                size="lg"
                className="h-14 w-14 rounded-full"
                onClick={toggleVideo}
              >
                {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
