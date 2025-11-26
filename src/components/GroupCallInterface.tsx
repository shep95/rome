import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Users, MonitorUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGroupWebRTC } from '@/hooks/useGroupWebRTC';
import { cn } from '@/lib/utils';

interface GroupCallInterfaceProps {
  conversationId: string;
  isVideo?: boolean;
  onEnd: () => void;
}

export const GroupCallInterface = ({
  conversationId,
  isVideo = false,
  onEnd
}: GroupCallInterfaceProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  const {
    isCallActive,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    localStream,
    screenStream,
    participants,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare
  } = useGroupWebRTC({ conversationId, isVideo });

  // Set up local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video elements
  useEffect(() => {
    participants.forEach((participant, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement && participant.stream) {
        videoElement.srcObject = participant.stream;
      }
    });
  }, [participants]);

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

  const participantCount = participants.size + 1; // +1 for local user
  
  // Get participants who are screen sharing
  const screenSharingParticipants = Array.from(participants.entries()).filter(
    ([_, p]) => p.isScreenSharing && p.screenStream
  );
  
  // Prioritize screen shares in the grid
  const showingScreenShare = screenSharingParticipants.length > 0 || isScreenSharing;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Participants Grid */}
      <div className="flex-1 relative bg-black p-4">
        {showingScreenShare ? (
          /* Screen Share Layout */
          <div className="h-full flex flex-col gap-4">
            {/* Main screen share area */}
            <div className="flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {isScreenSharing && screenStream ? (
                <div className="relative w-full h-full">
                  <video
                    ref={(el) => {
                      if (el && screenStream) el.srcObject = screenStream;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-4 bg-primary text-white text-sm px-3 py-1 rounded">
                    You're presenting
                  </div>
                </div>
              ) : screenSharingParticipants.length > 0 && (
                <video
                  ref={(el) => {
                    if (el && screenSharingParticipants[0][1].screenStream) {
                      el.srcObject = screenSharingParticipants[0][1].screenStream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            
            {/* Participant thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {/* Local user */}
              <Card className="relative flex-shrink-0 w-32 h-24 overflow-hidden bg-black">
                {isVideo && localStream && isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-xs">You</span>
                  </div>
                )}
                {isMuted && (
                  <div className="absolute bottom-1 right-1 bg-destructive rounded-full p-1">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
              </Card>

              {/* Remote participants */}
              {Array.from(participants.entries()).map(([userId, participant]) => (
                <Card key={userId} className="relative flex-shrink-0 w-32 h-24 overflow-hidden bg-black">
                  {isVideo && participant.stream && participant.isVideoEnabled ? (
                    <video
                      ref={(el) => {
                        if (el && participant.stream) el.srcObject = participant.stream;
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-xs">User</span>
                    </div>
                  )}
                  {participant.isMuted && (
                    <div className="absolute bottom-1 right-1 bg-destructive rounded-full p-1">
                      <MicOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Grid Layout (no screen sharing) */
          <div className={cn(
            "grid gap-4 h-full",
            participantCount === 1 && "grid-cols-1",
            participantCount === 2 && "grid-cols-2",
            participantCount === 3 && "grid-cols-2 grid-rows-2",
            participantCount === 4 && "grid-cols-2 grid-rows-2",
            participantCount > 4 && "grid-cols-3 auto-rows-fr"
          )}>
            {/* Local User */}
            <Card className={cn(
              "relative overflow-hidden bg-black flex items-center justify-center",
              participantCount === 1 && "col-span-1 row-span-1",
              participantCount === 3 && "col-span-2"
            )}>
              {isVideo && localStream && isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-white/70">You</p>
                </div>
              )}
              
              {/* Muted indicator */}
              {isMuted && (
                <div className="absolute bottom-4 left-4 bg-destructive text-white rounded-full p-2">
                  <MicOff className="h-4 w-4" />
                </div>
              )}
            </Card>

            {/* Remote Participants */}
            {Array.from(participants.entries()).map(([userId, participant]) => (
              <Card key={userId} className="relative overflow-hidden bg-black flex items-center justify-center">
                {isVideo && participant.stream && participant.isVideoEnabled ? (
                  <video
                    ref={(el) => {
                      if (el) remoteVideoRefs.current.set(userId, el);
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarFallback>{userId.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-white/70">Participant</p>
                  </div>
                )}
                
                {/* Muted indicator */}
                {participant.isMuted && (
                  <div className="absolute bottom-4 left-4 bg-destructive text-white rounded-full p-2">
                    <MicOff className="h-4 w-4" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Participant counter */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{participantCount}</span>
        </div>
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

            {/* Screen Share */}
            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className="h-14 w-14 rounded-full"
              onClick={toggleScreenShare}
            >
              <MonitorUp className="h-6 w-6" />
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
