// // src/components/AudioCall.tsx
// import React, { useEffect } from "react";

// import { loadDevice } from "../mediasoup/device";

// import socket from "@/socket";

// import { createTransport,sendTrack} from "./mediaHandler";

// const AudioCall: React.FC = () => {
//   useEffect(() => {
//     (async () => {
//       const device = await loadDevice();

//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const transport = await createTransport(device);
//       const audioTrack = stream.getAudioTracks()[0];
//       await sendTrack(transport, audioTrack);

//       socket.on("newProducer", async ({ producerId }) => {
//         const remoteTrack = await consumeTrack(device, producerId);
//         if (remoteTrack.kind === "audio") {
//           const audio = document.createElement("audio");
//           audio.srcObject = new MediaStream([remoteTrack]);
//           audio.autoplay = true;
//           document.body.appendChild(audio);
//         }
//       });
//     })();
//   }, []);

//   return <h2>🎙 Audio Call</h2>;
// };

// export default AudioCall;