import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  PhoneIncoming,
  PhoneMissed,
} from 'lucide-react';
import { BASE_URL } from '@/lib/baseUrl';

const socket = io(BASE_URL); // 🔁 Update with your signaling server

const VideoCalls: React.FC = () => {
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const ringtoneAudio = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [callerOffer, setCallerOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [isCaller, setIsCaller] = useState(false);

  const servers: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  useEffect(() => {
    socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      if (!isCaller) {
        setCallerOffer(offer);
        setIsReceivingCall(true);
        try {
          await ringtoneAudio.current?.play();
        } catch (err) {
          console.warn("🔇 Ringtone play failed", err);
        }

        timeoutRef.current = setTimeout(() => {
          console.log("⏰ Video call timed out");
          rejectCall(true);
        }, 30000);
      }
    });

    socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('candidate', (candidate: RTCIceCandidateInit) => {
      if (peerConnection.current && candidate) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('call-rejected', () => {
      endCall();
      alert('Call was rejected');
    });

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('candidate');
      socket.off('call-rejected');
    };
  }, [isCaller]);

  const addHandlers = () => {
    if (!peerConnection.current) return;

    peerConnection.current.ontrack = (event: RTCTrackEvent) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };
  };

  const setupConnection = async () => {
    peerConnection.current = new RTCPeerConnection(servers);
    addHandlers();

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, localStream.current!);
    });

    if (localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  };

  const startCall = async () => {
    await setupConnection();
    const offer = await peerConnection.current!.createOffer();
    await peerConnection.current!.setLocalDescription(offer);
    socket.emit('offer', offer);
    setInCall(true);
    setIsCaller(true);
  };

  const acceptCall = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    ringtoneAudio.current?.pause();
    setIsReceivingCall(false);

    await setupConnection();
    await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(callerOffer!));
    const answer = await peerConnection.current!.createAnswer();
    await peerConnection.current!.setLocalDescription(answer);
    socket.emit('answer', answer);
    setInCall(true);
  };

  const rejectCall = (auto = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    ringtoneAudio.current?.pause();
    setIsReceivingCall(false);
    socket.emit('call-rejected');
    setIsCaller(false);

    if (!auto) console.log("🚫 Video call manually rejected");
    else console.log("⏰ Auto rejected video call");
  };

  const toggleMute = () => {
    if (!localStream.current) return;
    localStream.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    if (!localStream.current) return;
    localStream.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setVideoOn((prev) => !prev);
  };

  const endCall = () => {
    peerConnection.current?.close();
    peerConnection.current = null;
    setInCall(false);
    setIsReceivingCall(false);
    setIsCaller(false);

    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;

    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;
  };

  return (
    <div className="w-full h-screen bg-black relative flex items-center justify-center">
      {/* Ringtone Audio */}
      <audio
        ref={ringtoneAudio}
        src="/7120-download-iphone-6-original-ringtone-42676.mp3"
        loop
        preload="auto"
      />

      {/* Remote video fullscreen */}
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        className="absolute w-full h-full object-cover z-0"
      />

      {/* Local video small preview */}
      <video
        ref={localVideo}
        autoPlay
        muted
        playsInline
        className="absolute bottom-5 right-5 w-32 h-32 z-10 rounded-md shadow-lg object-cover border-2 border-white"
      />

      {/* Incoming Call Popup */}
      {isReceivingCall && (
        <div className="absolute top-1/3 text-center space-y-4 z-30">
          <h2 className="text-xl font-bold text-white">Incoming Video Call...</h2>
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={acceptCall} className="bg-green-500 p-4 rounded-full">
              <PhoneIncoming className="w-6 h-6 text-white" />
            </button>
            <button onClick={() => rejectCall()} className="bg-red-600 p-4 rounded-full">
              <PhoneMissed className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
        {inCall ? (
          <>
            <button onClick={toggleMute} className="bg-white p-3 rounded-full shadow">
              {isMuted ? <MicOff className="w-6 h-6 text-red-600" /> : <Mic className="w-6 h-6" />}
            </button>
            <button onClick={toggleVideo} className="bg-white p-3 rounded-full shadow">
              {videoOn ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6 text-red-600" />
              )}
            </button>
            <button onClick={endCall} className="bg-red-600 p-3 rounded-full shadow">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </>
        ) : (
          <button
            onClick={startCall}
            className="bg-green-500 text-white px-6 py-3 rounded-full shadow text-lg"
          >
            Start Call
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCalls;
