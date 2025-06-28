// src/components/CallScreen.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

const CallScreen = () => {
  const location = useLocation();
  const { callerId, receiverId, incoming, isVideo } = location.state;
console.log(callerId, receiverId, incoming)
  const socketRef = useRef(io("https://implusbackend-3xce.onrender.com"));
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
console.log(remoteStream)
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);

  useEffect(() => {
    initCall();

    return () => {
      socketRef.current.disconnect();
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const initCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    setLocalStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const socket = socketRef.current;

    // Load device
    const rtpCapabilities = await new Promise((res) =>
      socket.emit("getRtpCapabilities", res)
    );

    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    deviceRef.current = device;

    // Step 1: Create send transport
    const sendTransportData = await new Promise((res) =>
      socket.emit("createTransport", res)
    );

    const sendTransport = device.createSendTransport(sendTransportData);
    sendTransport.on("connect", ({ dtlsParameters }, cb) => {
      socket.emit("connectTransport", { dtlsParameters }, cb);
    });
    sendTransport.on("produce", async ({ kind, rtpParameters }, cb) => {
      const { id } = await new Promise((res) =>
        socket.emit("produce", { kind, rtpParameters }, res)
      );
      cb({ id });
    });

    sendTransportRef.current = sendTransport;

    // Step 2: Produce each track
    for (const track of stream.getTracks()) {
      await sendTransport.produce({ track });
    }

    // Wait for another peer to join, then listen for producer
    socket.on("newProducer", async ({ producerId }) => {
      const recvTransportData = await new Promise((res) =>
        socket.emit("createTransport", res)
      );
      const recvTransport = device.createRecvTransport(recvTransportData);
      recvTransport.on("connect", ({ dtlsParameters }, cb) =>
        socket.emit("connectTransport", { dtlsParameters }, cb)
      );

      const consumerParams = await new Promise<any>((res) =>
        socket.emit(
          "consume",
          { producerId, rtpCapabilities: device.rtpCapabilities },
          res
        )
      );

      const consumer = await recvTransport.consume(consumerParams);
      const remoteMediaStream = new MediaStream();
      remoteMediaStream.addTrack(consumer.track);
      setRemoteStream(remoteMediaStream);
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = remoteMediaStream;

      recvTransportRef.current = recvTransport;
    });
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white p-4 space-y-4">
      <h2 className="text-xl">{isVideo ? "Video" : "Audio"} Call</h2>
      <div className="flex gap-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-48 h-48 border rounded-xl"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-48 h-48 border rounded-xl"
        />
      </div>
      <button
        onClick={() => window.history.back()}
        className="bg-red-600 text-white px-6 py-2 rounded-xl"
      >
        End Call
      </button>
    </div>
  );
};

export default CallScreen;
