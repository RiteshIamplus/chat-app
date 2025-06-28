// import React, { useEffect, useRef, useState } from "react";

// import { loadDevice } from "../mediasoup/device";

// import socket from "@/socket";
// import { consumeTrack, createTransport, sendTrack } from "./mediaHandler";

// const VideoCall: React.FC = () => {
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
//   const localVideoRef = useRef<HTMLVideoElement | null>(null);

//   useEffect(() => {
//     (async () => {
//       const device = await loadDevice();

//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       setLocalStream(stream);

//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       const transport = await createTransport(device);
//       const videoTrack = stream.getVideoTracks()[0];
//       await sendTrack(transport, videoTrack);

//       socket.on("newProducer", async ({ producerId }) => {
//         const remoteTrack = await consumeTrack(device, producerId);
//         if (remoteTrack.kind === "video") {
//           const remoteVideo = document.createElement("video");
//           remoteVideo.srcObject = new MediaStream([remoteTrack]);
//           remoteVideo.autoplay = true;
//           remoteVideo.playsInline = true;
//           document.body.appendChild(remoteVideo);
//         }
//       });
//     })();
//   }, []);

//   return (
//     <div>
//       <h2>📹 Video Call</h2>
//       <video
//         ref={localVideoRef}
//         autoPlay
//         muted
//         playsInline
//         style={{ width: 300, border: "2px solid #444" }}
//       />
//     </div>
//   );
// };

// export default VideoCall;