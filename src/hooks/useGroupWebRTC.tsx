import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Participant {
  userId: string;
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

interface GroupWebRTCHookProps {
  conversationId: string;
  isVideo?: boolean;
}

export const useGroupWebRTC = ({ conversationId, isVideo = false }: GroupWebRTCHookProps) => {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [callDuration, setCallDuration] = useState(0);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenPeerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
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

  // Create peer connection for a specific user
  const createPeerConnection = useCallback((remoteUserId: string) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      setParticipants(prev => {
        const newParticipants = new Map(prev);
        const participant = newParticipants.get(remoteUserId) || {
          userId: remoteUserId,
          stream: null,
          screenStream: null,
          isMuted: false,
          isVideoEnabled: true,
          isScreenSharing: false
        };
        participant.stream = event.streams[0];
        newParticipants.set(remoteUserId, participant);
        return newParticipants;
      });
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
            userId: user?.id,
            targetUserId: remoteUserId
          }
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteUserId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeer(remoteUserId);
      }
    };

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  }, [conversationId, user]);

  // Remove a peer connection
  const removePeer = useCallback((userId: string) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }
    
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.delete(userId);
      return newParticipants;
    });
  }, []);

  // Setup signaling channel
  useEffect(() => {
    if (!isCallActive || !user) return;

    const channel = supabase.channel(`group-call:${conversationId}`);

    channel
      // When a new user joins the call
      .on('broadcast', { event: 'join-call' }, async ({ payload }) => {
        if (payload.userId === user.id) return;

        console.log('User joined call:', payload.userId);
        
        // Create offer for the new user
        const pc = createPeerConnection(payload.userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        channel.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            conversationId,
            offer,
            userId: user.id,
            targetUserId: payload.userId
          }
        });
      })
      // Handle incoming offers
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.targetUserId !== user.id) return;

        console.log('Received offer from:', payload.userId);

        const pc = createPeerConnection(payload.userId);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            conversationId,
            answer,
            userId: user.id,
            targetUserId: payload.userId
          }
        });
      })
      // Handle incoming answers
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.targetUserId !== user.id) return;

        console.log('Received answer from:', payload.userId);

        const pc = peerConnectionsRef.current.get(payload.userId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      })
      // Handle ICE candidates
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.targetUserId !== user.id) return;

        const pc = peerConnectionsRef.current.get(payload.userId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      // Handle user leaving
      .on('broadcast', { event: 'leave-call' }, ({ payload }) => {
        if (payload.userId === user.id) return;
        console.log('User left call:', payload.userId);
        removePeer(payload.userId);
      })
      // Handle screen share offers
      .on('broadcast', { event: 'screen-offer' }, async ({ payload }) => {
        if (payload.targetUserId !== user.id) return;

        console.log('Received screen offer from:', payload.userId);

        const pc = new RTCPeerConnection(rtcConfiguration);

        pc.ontrack = (event) => {
          setParticipants(prev => {
            const newParticipants = new Map(prev);
            const participant = newParticipants.get(payload.userId) || {
              userId: payload.userId,
              stream: null,
              screenStream: null,
              isMuted: false,
              isVideoEnabled: true,
              isScreenSharing: false
            };
            participant.screenStream = event.streams[0];
            participant.isScreenSharing = true;
            newParticipants.set(payload.userId, participant);
            return newParticipants;
          });
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && signalingChannelRef.current) {
            signalingChannelRef.current.send({
              type: 'broadcast',
              event: 'ice-candidate-screen',
              payload: {
                conversationId,
                candidate: event.candidate,
                userId: user?.id,
                targetUserId: payload.userId
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
            userId: user.id,
            targetUserId: payload.userId
          }
        });

        screenPeerConnectionsRef.current.set(payload.userId, pc);
      })
      // Handle screen share answers
      .on('broadcast', { event: 'screen-answer' }, async ({ payload }) => {
        if (payload.targetUserId !== user.id) return;

        console.log('Received screen answer from:', payload.userId);

        const pc = screenPeerConnectionsRef.current.get(payload.userId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      })
      // Handle screen share ICE candidates
      .on('broadcast', { event: 'ice-candidate-screen' }, async ({ payload }) => {
        if (payload.targetUserId !== user.id) return;

        const pc = screenPeerConnectionsRef.current.get(payload.userId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      // Handle screen share stop
      .on('broadcast', { event: 'screen-stop' }, ({ payload }) => {
        if (payload.userId === user.id) return;

        console.log('User stopped screen sharing:', payload.userId);

        const pc = screenPeerConnectionsRef.current.get(payload.userId);
        if (pc) {
          pc.close();
          screenPeerConnectionsRef.current.delete(payload.userId);
        }

        setParticipants(prev => {
          const newParticipants = new Map(prev);
          const participant = newParticipants.get(payload.userId);
          if (participant) {
            participant.screenStream = null;
            participant.isScreenSharing = false;
            newParticipants.set(payload.userId, participant);
          }
          return newParticipants;
        });
      })
      .subscribe();

    signalingChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [isCallActive, conversationId, user, createPeerConnection, removePeer]);

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

      // Announce joining the call
      setTimeout(() => {
        if (signalingChannelRef.current) {
          signalingChannelRef.current.send({
            type: 'broadcast',
            event: 'join-call',
            payload: {
              conversationId,
              userId: user?.id
            }
          });
        }
      }, 500);

      toast.success(video ? 'Video call started' : 'Voice call started');
    } catch (error) {
      console.error('Error starting call:', error);
      endCall();
    }
  };

  // End call
  const endCall = useCallback(() => {
    // Announce leaving
    if (signalingChannelRef.current && user) {
      signalingChannelRef.current.send({
        type: 'broadcast',
        event: 'leave-call',
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

    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    setIsCallActive(false);
    setParticipants(new Map());
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

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Close all screen peer connections
      screenPeerConnectionsRef.current.forEach(pc => pc.close());
      screenPeerConnectionsRef.current.clear();

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

        // Create offers to all participants
        const participantIds = Array.from(peerConnectionsRef.current.keys());
        
        for (const participantId of participantIds) {
          const pc = new RTCPeerConnection(rtcConfiguration);

          screenStream.getTracks().forEach(track => {
            pc.addTrack(track, screenStream);
          });

          pc.onicecandidate = (event) => {
            if (event.candidate && signalingChannelRef.current) {
              signalingChannelRef.current.send({
                type: 'broadcast',
                event: 'ice-candidate-screen',
                payload: {
                  conversationId,
                  candidate: event.candidate,
                  userId: user?.id,
                  targetUserId: participantId
                }
              });
            }
          };

          screenPeerConnectionsRef.current.set(participantId, pc);

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          if (signalingChannelRef.current) {
            signalingChannelRef.current.send({
              type: 'broadcast',
              event: 'screen-offer',
              payload: {
                conversationId,
                offer,
                userId: user?.id,
                targetUserId: participantId
              }
            });
          }
        }

        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      } catch (error) {
        console.error('Error starting screen share:', error);
        toast.error('Could not start screen sharing');
      }
    }
  }, [isScreenSharing, conversationId, user, rtcConfiguration, peerConnectionsRef]);

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
    participants,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare
  };
};
