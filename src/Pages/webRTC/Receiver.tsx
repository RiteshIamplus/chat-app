// import { BASE_URL } from "@/lib/baseUrl";
// import { useEffect, useRef } from "react";
// import { io, Socket } from "socket.io-client";
// import { v4 as uuidv4 } from "uuid";

// // ✅ Constants
// const SIGNALING_SERVER = BASE_URL;
// const ROOM_ID = "file-transfer-room";
// const USER_ID = uuidv4();

// const Receiver = () => {
//   // ✅ Refs with proper types
//   const socket = useRef<Socket | null>(null);
//   const peer = useRef<RTCPeerConnection | null>(null);
//   const receivedBuffers = useRef<Uint8Array[]>([]);
//   const fileNameRef = useRef<string>("received-file");
  

//   useEffect(() => {
//     // ✅ Init socket
//     socket.current = io(SIGNALING_SERVER, { transports: ["websocket"] });

//     // ✅ Init peer
//     peer.current = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });

//     // ✅ Handle incoming data channel
//     peer.current.ondatachannel = (event) => {
//       const channel = event.channel;

//       channel.onopen = () => console.log("✅ Data channel open (receiver)");

//       channel.onmessage = (e) => {
//   if (typeof e.data === "string") {
//     if (e.data === "EOF") {
//       const blob = new Blob(receivedBuffers.current);
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//        a.download = fileNameRef.current;
//       a.click();
//       console.log("📥 File received:", fileNameRef.current);

//       // Reset for next file
//       receivedBuffers.current = [];
//       fileNameRef.current = "file";
//     } else {
//       try {
//         const meta = JSON.parse(e.data);
//         if (meta.fileName) {
//           fileNameRef.current = meta.fileName;
//           console.log("📁 Receiving:", meta.fileName);
//         }
//       } catch {
//         console.warn("⚠ Unknown text message:", e.data);
//       }
//     }
//   } else if (e.data instanceof ArrayBuffer) {
//     receivedBuffers.current.push(new Uint8Array(e.data));
//   } else if (e.data instanceof Blob) {
//     e.data.arrayBuffer().then((buf) => {
//       receivedBuffers.current.push(new Uint8Array(buf));
//     });
//   }
// };

//     };

//     // ✅ Emit candidates
//     peer.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.current?.emit("candidate", {
//           candidate: event.candidate,
//           roomId: ROOM_ID,
//           userId: USER_ID,
//         });
//       }
//     };

//    // ✅ Handle offer from room-offer event
//    socket.current.on("offer", async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
//     await peer.current!.setRemoteDescription(new RTCSessionDescription(data.offer));
//     const answer = await peer.current!.createAnswer();
//     await peer.current!.setLocalDescription(answer);
  
//     socket.current?.emit("room-answer", {
//       answer,
//       to: data.from,
//       roomId: ROOM_ID,
//     });
//   });
  
  

//     // ✅ Handle candidate
//     socket.current.on("candidate", async (data: { candidate: RTCIceCandidateInit }) => {
//       try {
//         await peer.current!.addIceCandidate(new RTCIceCandidate(data.candidate));
//       } catch (err) {
//         console.error("ICE error", err);
//       }
//     });

//     // ✅ Join room
//     socket.current.emit("join-room", {
//       roomId: ROOM_ID,
//       userId: USER_ID,
//     });

//     return () => {
//       socket.current?.disconnect();
//       peer.current?.close();
//     };
//   }, []); // ✅ Empty deps: only runs once

//   return (
//     <div>
//       <h2>📥 Receiver</h2>
//       <p>Waiting for file...</p>
//     </div>
//   );
// };

// export default Receiver;