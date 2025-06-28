import React, { useEffect, useRef, useState } from "react";
import { Device, types } from "mediasoup-client";
import socket from "@/socket";

// Interfaces for socket responses
interface TransportOptions extends types.TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
}

interface ConsumerParams {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: types.RtpParameters;
}

const CallScreen: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [device, setDevice] = useState<types.Device | null>(null);
  const [sendTransport, setSendTransport] = useState<types.SendTransport | null>(null);
  const [recvTransport, setRecvTransport] = useState<types.RecvTransport | null>(null);

  console.log(sendTransport,device,recvTransport)
  useEffect(() => {
    const startCall = async () => {
      // Step 1: Load RTP Capabilities
      const routerRtpCapabilities: types.RtpCapabilities = await new Promise((resolve) => {
        socket.emit("getRtpCapabilities", resolve);
      });

      const device = new Device();
      await device.load({ routerRtpCapabilities });
      setDevice(device);

      // Step 2: Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Step 3: Create Send Transport
      const sendTransportOptions: TransportOptions = await new Promise((resolve) => {
        socket.emit("createTransport", resolve);
      });

      const sendTransport = device.createSendTransport(sendTransportOptions);

      sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
        socket.emit("connectTransport", { dtlsParameters }, (res: string) => {
          res === "connected" ? callback() : errback(new Error("Failed to connect send transport"));
        });
      });

      sendTransport.on("produce", ({ kind, rtpParameters }, callback, errback) => {
        socket.emit("produce", { kind, rtpParameters }, (response: { id: string }) => {
          if (response?.id) callback({ id: response.id });
          else errback(new Error("Failed to produce"));
        });
      });

      setSendTransport(sendTransport);

      // Step 4: Produce Track
      const track = stream.getVideoTracks()[0];
      const producer = await sendTransport.produce({ track });

      // Step 5: Create Receive Transport
      const recvTransportOptions: TransportOptions = await new Promise((resolve) => {
        socket.emit("createTransport", resolve);
      });

      const recvTransport = device.createRecvTransport(recvTransportOptions);

      recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
        socket.emit("connectTransport", { dtlsParameters }, (res: string) => {
          res === "connected" ? callback() : errback(new Error("Failed to connect recv transport"));
        });
      });

      setRecvTransport(recvTransport);

      // Step 6: Consume Remote Track
      const consumerParams: ConsumerParams = await new Promise((resolve) => {
        socket.emit(
          "consume",
          {
            producerId: producer.id,
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

      const remoteStream = new MediaStream([consumer.track]);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    startCall();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">📞 Mediasoup Video Call</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-md font-medium mb-1">Local Video</h3>
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded border" />
        </div>
        <div>
          <h3 className="text-md font-medium mb-1">Remote Video</h3>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded border" />
        </div>
      </div>
    </div>
  );
};

export default CallScreen;
