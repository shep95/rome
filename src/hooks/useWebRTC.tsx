import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface WebRTCHookProps {
  conversationId: string;
  isVideo?: boolean;
}

export const useWebRTC = ({ conversationId, isVideo = false }: WebRTCHookProps) => {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const screenPeerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout>();
  const signalingChannelRef = useRef<any>(null);

  // WebRTC configuration with STUN servers
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize local media stream
  const getLocalStream = async (video: boolean = isVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
      });

      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone');
      throw error;
    }
  };

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            conversationId,
            candidate: event.candidate,
            userId: user?.id
          }
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [conversationId, user]);

  // Setup signaling channel
  useEffect(() => {
    if (!isCallActive || !user) return;

    const channel = supabase.channel(`call:${conversationId}`);

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.userId === user.id) return;

        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            conversationId,
            answer,
            userId: user.id
          }
        });
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.userId === user.id || !peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.userId === user.id) return;
        
        const pc = payload.isScreen ? screenPeerConnectionRef.current : peerConnectionRef.current;
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      .on('broadcast', { event: 'screen-offer' }, async ({ payload }) => {
        if (payload.userId === user.id) return;

        const pc = new RTCPeerConnection(rtcConfiguration);
        
        pc.ontrack = (event) => {
          setRemoteScreenStream(event.streams[0]);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && signalingChannelRef.current) {
            signalingChannelRef.current.send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: {
                conversationId,
                candidate: event.candidate,
                userId: user?.id,
                isScreen: true
              }
            });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
          type: 'broadcast',
          event: 'screen-answer',
          payload: {
            conversationId,
            answer,
            userId: user.id
          }
        });

        screenPeerConnectionRef.current = pc;
      })
      .on('broadcast', { event: 'screen-answer' }, async ({ payload }) => {
        if (payload.userId === user.id || !screenPeerConnectionRef.current) return;
        await screenPeerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      })
      .on('broadcast', { event: 'screen-stop' }, ({ payload }) => {
        if (payload.userId === user.id) return;
        setRemoteScreenStream(null);
        if (screenPeerConnectionRef.current) {
          screenPeerConnectionRef.current.close();
          screenPeerConnectionRef.current = null;
        }
      })
      .on('broadcast', { event: 'call-started' }, () => {
        // Notify that call is active
      })
      .on('broadcast', { event: 'call-ended' }, () => {
        // Notify that call ended
      })
      .subscribe();

    signalingChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [isCallActive, conversationId, user, createPeerConnection]);

  // Start call
  const startCall = async (video: boolean = isVideo) => {
    try {
      await getLocalStream(video);
      setIsCallActive(true);
      setIsVideoEnabled(video);
      
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);

      // Create offer
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer through signaling channel
      if (signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            conversationId,
            offer,
            userId: user?.id
          }
        });
        
        // Announce call started
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'call-started',
          payload: {
            conversationId,
            userId: user?.id,
            isVideo: video
          }
        });
      }

      toast.success(video ? 'Video call started' : 'Voice call started');
    } catch (error) {
      console.error('Error starting call:', error);
      endCall();
    }
  };

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      if (screenPeerConnectionRef.current) {
        screenPeerConnectionRef.current.close();
        screenPeerConnectionRef.current = null;
      }

      if (signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'screen-stop',
          payload: {
            conversationId,
            userId: user?.id
          }
        });
      }

      setIsScreenSharing(false);
      toast.info('Screen sharing stopped');
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        screenStreamRef.current = screenStream;

        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };

        // Create new peer connection for screen
        const pc = new RTCPeerConnection(rtcConfiguration);

        screenStream.getTracks().forEach(track => {
          pc.addTrack(track, screenStream);
        });

        pc.onicecandidate = (event) => {
          if (event.candidate && signalingChannelRef.current) {
            signalingChannelRef.current.send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: {
                conversationId,
                candidate: event.candidate,
                userId: user?.id,
                isScreen: true
              }
            });
          }
        };

        screenPeerConnectionRef.current = pc;

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (signalingChannelRef.current) {
          signalingChannelRef.current.send({
            type: 'broadcast',
            event: 'screen-offer',
            payload: {
              conversationId,
              offer,
              userId: user?.id
            }
          });
        }

        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      } catch (error) {
        console.error('Error starting screen share:', error);
        toast.error('Could not start screen sharing');
      }
    }
  }, [isScreenSharing, conversationId, user, rtcConfiguration]);

  // End call
  const endCall = useCallback(() => {
    // Announce call ended
    if (signalingChannelRef.current && user) {
      signalingChannelRef.current.send({
        type: 'broadcast',
        event: 'call-ended',
        payload: {
          conversationId,
          userId: user.id
        }
      });
    }

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Close peer connections
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (screenPeerConnectionRef.current) {
      screenPeerConnectionRef.current.close();
      screenPeerConnectionRef.current = null;
    }

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    setIsCallActive(false);
    setIsScreenSharing(false);
    setRemoteStream(null);
    setRemoteScreenStream(null);
    setCallDuration(0);
    toast.info('Call ended');
  }, [conversationId, user]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    isCallActive,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    localStream: localStreamRef.current,
    screenStream: screenStreamRef.current,
    remoteStream,
    remoteScreenStream,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare
  };
};
