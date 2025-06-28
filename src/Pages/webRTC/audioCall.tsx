// import { useEffect, useRef, useState } from 'react';
// import io from 'socket.io-client';
// import {
//   Phone,
//   PhoneOff,
//   Mic,
//   MicOff,
//   PhoneIncoming,
//   PhoneMissed,
// } from 'lucide-react';
// import { BASE_URL } from '@/lib/baseUrl';

// const socket = io(BASE_URL); // Your signaling server

// const AudioCalls: React.FC = () => {
//   const localStream = useRef<MediaStream | null>(null);
//   const remoteAudio = useRef<HTMLAudioElement | null>(null);
//   const ringtoneAudio = useRef<HTMLAudioElement | null>(null);
//   const peerConnection = useRef<RTCPeerConnection | null>(null);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const [inCall, setInCall] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isReceivingCall, setIsReceivingCall] = useState(false);
//   const [callerOffer, setCallerOffer] = useState<RTCSessionDescriptionInit | null>(null);
//   const [isCaller, setIsCaller] = useState(false);

//   const servers: RTCConfiguration = {
//     iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//   };

//   useEffect(() => {
//     socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
//         if (!isCaller) {
//           console.log('📞 Incoming call...');
//           setCallerOffer(offer);
//           setIsReceivingCall(true);
//           ringtoneAudio.current?.play().catch((e) =>
//             console.warn('Ringtone play failed:', e)
//           );
      
//           // ⏳ Auto timeout in 30 seconds (30000 ms)
//           timeoutRef.current = setTimeout(() => {
//             console.log("⏱️ Call timed out.");
//             rejectCall(true); // Auto reject
//           }, 30000);
//         }
//       });
      

//     socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
//       await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
//     });

//     socket.on('candidate', (candidate: RTCIceCandidateInit) => {
//       if (peerConnection.current && candidate) {
//         peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
//       }
//     });

//     socket.on('call-rejected', () => {
//       endCall();
//       alert('Call rejected');
//     });

//     return () => {
//       socket.off('offer');
//       socket.off('answer');
//       socket.off('candidate');
//       socket.off('call-rejected');
//     };
//   }, [isCaller]);

//   const setupConnection = async () => {
//     peerConnection.current = new RTCPeerConnection(servers);

//     localStream.current = await navigator.mediaDevices.getUserMedia({
//       audio: true,
//       video: false,
//     });

//     localStream.current.getTracks().forEach((track) => {
//       peerConnection.current?.addTrack(track, localStream.current!);
//     });

//     peerConnection.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit('candidate', event.candidate);
//       }
//     };

//     peerConnection.current.ontrack = (event) => {
//       const [remoteStream] = event.streams;
//       if (remoteAudio.current) {
//         remoteAudio.current.srcObject = remoteStream;
//       }
//     };
//   };

//   const startCall = async () => {
//     await setupConnection();

//     const offer = await peerConnection.current!.createOffer();
//     await peerConnection.current!.setLocalDescription(offer);
//     socket.emit('offer', offer);
//     setIsCaller(true);
//     setInCall(true);
//   };

//   const acceptCall = async () => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//       timeoutRef.current = null;
//     }
  
//     ringtoneAudio.current?.pause();
//     setIsReceivingCall(false);
//     await setupConnection();
  
//     await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(callerOffer!));
//     const answer = await peerConnection.current!.createAnswer();
//     await peerConnection.current!.setLocalDescription(answer);
//     socket.emit('answer', answer);
//     setInCall(true);
//   };
  
//   const rejectCall = (auto = false) => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//       timeoutRef.current = null;
//     }
  
//     ringtoneAudio.current?.pause();
//     setIsReceivingCall(false);
  
//     if (!auto) console.log("🚫 Call manually rejected");
//     else console.log("⏰ Call auto rejected after timeout");
  
//     socket.emit('call-rejected');
//     setIsCaller(false);
//   };
  
//   const toggleMute = () => {
//     if (!localStream.current) return;
//     localStream.current.getAudioTracks().forEach((track) => {
//       track.enabled = !track.enabled;
//     });
//     setIsMuted((prev) => !prev);
//   };

//   const endCall = () => {
//     peerConnection.current?.close();
//     peerConnection.current = null;
//     setInCall(false);
//     setIsReceivingCall(false);
//     setIsCaller(false);
//     localStream.current?.getTracks().forEach((track) => track.stop());
//     localStream.current = null;
//   };

//   return (
//     <div className="w-full h-screen bg-black text-white flex items-center justify-center relative">
//       <audio ref={ringtoneAudio} src="\7120-download-iphone-6-original-ringtone-42676.mp3" loop preload="auto" />
//       <audio ref={remoteAudio} autoPlay className="hidden" />

//       {isReceivingCall && (
//         <div className="absolute top-1/3 text-center space-y-4">
//           <h2 className="text-xl font-bold">Incoming Audio Call...</h2>
//           <div className="flex justify-center gap-4 mt-4">
//             <button onClick={acceptCall} className="bg-green-500 p-4 rounded-full">
//               <PhoneIncoming className="w-6 h-6 text-white" />
//             </button>
//             <button onClick={rejectCall} className="bg-red-600 p-4 rounded-full">
//               <PhoneMissed className="w-6 h-6 text-white" />
//             </button>
//           </div>
//         </div>
//       )}

//       {inCall && (
//         <div className="flex flex-col items-center">
//           <h2 className="text-2xl font-semibold mb-6">Audio Call Connected</h2>
//           <div className="flex gap-6">
//             <button onClick={toggleMute} className="bg-white p-3 rounded-full shadow">
//               {isMuted ? (
//                 <MicOff className="w-6 h-6 text-red-600" />
//               ) : (
//                 <Mic className="w-6 h-6 text-black" />
//               )}
//             </button>
//             <button onClick={endCall} className="bg-red-600 p-3 rounded-full shadow">
//               <PhoneOff className="w-6 h-6 text-white" />
//             </button>
//           </div>
//         </div>
//       )}

//       {!inCall && !isReceivingCall && (
//         <button
//           onClick={startCall}
//           className="bg-green-500 text-white px-6 py-3 rounded-full shadow text-lg"
//         >
//           <Phone className="inline-block mr-2" /> Start Audio Call
//         </button>
//       )}
//     </div>
//   );
// };

// export default AudioCalls;
