// // src/mediasoup/mediaHandlers.ts

// import socket from "@/socket";
// import { types } from "mediasoup-client";

// interface TransportParams {
//   id: string;
//   iceParameters: any;
//   iceCandidates: any[];
//   dtlsParameters: any;
// }

// interface ConsumerParams {
//   id: string;
//   producerId: string;
//   kind: string;
//   rtpParameters: any;
// }

// export const createTransport = async (
//   device: types.Device
// ): Promise<types.SendTransport> => {
//   const transportParams: TransportParams = await new Promise((resolve) => {
//     socket.emit("createTransport", resolve);
//   });

//   const transport = device.createSendTransport(transportParams);

//   transport.on("connect", ({ dtlsParameters }, callback, errback) => {
//     socket.emit("connectTransport", { dtlsParameters }, (res: string) => {
//       res === "connected" ? callback() : errback(new Error("Failed to connect transport"));
//     });
//   });

//   return transport;
// };

// export const sendTrack = async (
//   transport: types.SendTransport,
//   track: MediaStreamTrack
// ): Promise<types.Producer> => {
//   const producer = await transport.produce({ track });

//   socket.emit(
//     "produce",
//     {
//       kind: producer.kind,
//       rtpParameters: producer.rtpParameters,
//     },
//     ({ id }: { id: string }) => {
//       console.log("✅ Producer ID:", id);
//     }
//   );

//   return producer;
// };

// export const consumeTrack = async (
//   device: types.Device,
//   producerId: string
// ): Promise<MediaStreamTrack> => {
//   const transportParams: TransportParams = await new Promise((resolve) => {
//     socket.emit("createTransport", resolve);
//   });

//   const recvTransport = device.createRecvTransport(transportParams);

//   recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
//     socket.emit("connectTransport", { dtlsParameters }, (res: string) => {
//       res === "connected" ? callback() : errback(new Error("Failed to connect transport"));
//     });
//   });

//   const consumerParams: ConsumerParams = await new Promise((resolve) => {
//     socket.emit(
//       "consume",
//       {
//         producerId,
//         rtpCapabilities: device.rtpCapabilities,
//       },
//       resolve
//     );
//   });

//   const consumer = await recvTransport.consume({
//     id: consumerParams.id,
//     producerId: consumerParams.producerId,
//     kind: consumerParams.kind as "audio" | "video",
//     rtpParameters: consumerParams.rtpParameters,
//   });

//   return consumer.track;
// };
