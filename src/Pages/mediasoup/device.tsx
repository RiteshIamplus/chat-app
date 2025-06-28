// src/mediasoup/device.ts
import socket from "@/socket";
import * as mediasoupClient from "mediasoup-client";


let device: mediasoupClient.types.Device;

export const loadDevice = async (): Promise<mediasoupClient.types.Device> => {
  if (device) return device;

  device = new mediasoupClient.Device();

  const rtpCapabilities = await new Promise<any>((resolve) => {
    socket.emit("getRtpCapabilities", (data: any) => resolve(data));
  });

  await device.load({ routerRtpCapabilities: rtpCapabilities });
  return device;
};