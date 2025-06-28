// src/mediasoup/mediaHandlers.ts

import socket from "@/socket";
import { types } from 'mediasoup-client';


export const createTransport = async (device: types.Device): Promise<types.Transport> => {
  const transportParams = await new Promise<any>((resolve) => {
    socket.emit("createTransport", resolve);
  });

  const transport = device.createSendTransport(transportParams);

  transport.on("connect", ({ dtlsParameters }, callback, errback) => {
    socket.emit("connectTransport", { dtlsParameters }, (res: string) => {
      res === "connected" ? callback() : errback();
    });
  });

  return transport;
};

export const sendTrack = async (
  transport: types.SendTransport,
  track: MediaStreamTrack
): Promise<types.Producer> => {
  const producer = await transport.produce({ track });

  socket.emit(
    "produce",
    {
      kind: producer.kind,
      rtpParameters: producer.rtpParameters,
    },
    ({ id }: { id: string }) => {
      console.log("✅ Producer ID:", id);
    }
  );

  return producer;
};

export const consumeTrack = async (
  device: types.Device,
  producerId: string
): Promise<MediaStreamTrack> => {
  const transportParams = await new Promise<any>((resolve) => {
    socket.emit("createTransport", resolve);
  });

  const recvTransport = device.createRecvTransport(transportParams);

  recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
    socket.emit("connectTransport", { dtlsParameters }, (res: string) => {
      res === "connected" ? callback() : errback();
    });
  });

  const consumerParams = await new Promise<any>((resolve) => {
    socket.emit(
      "consume",
      {
        producerId,
        rtpCapabilities: device.rtpCapabilities,
      },
      resolve
    );
  });

  const consumer = await recvTransport.consume({
    id: consumerParams.id,
    producerId: consumerParams.producerId,
    kind: consumerParams.kind,
    rtpParameters: consumerParams.rtpParameters,
  });

  return consumer.track;
};