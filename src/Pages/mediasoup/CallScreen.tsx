import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import { types } from "mediasoup-client";

const CallScreen = () => {
  const location = useLocation();
  const { callerId, receiverId, incoming, isVideo, roomId } = location.state;

  const socketRef = useRef(
    io("http://3.111.23.208:5000", {
      query: {
        userId: incoming ? receiverId : callerId,
        roomId: roomId,
      },
    })
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<types.Transport | null>(null);
  const recvTransportRef = useRef<types.Transport | null>(null);

  useEffect(() => {
    initCall();

    return () => {
      socketRef.current.disconnect();
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      localStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    setLocalStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const socket = socketRef.current;

    const rtpCapabilities = await new Promise<any>((res) =>
      socket.emit("getRtpCapabilities", res)
    );

    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    deviceRef.current = device;

    const sendTransportData = await new Promise<any>((res) =>
      socket.emit("createSendTransport", res)
    );

    const sendTransport = device.createSendTransport(sendTransportData);

    sendTransport.on("connect", ({ dtlsParameters }, cb) => {
      socket.emit(
        "connectTransport",
        { dtlsParameters, isConsumer: false },
        cb
      );
    });

    sendTransport.on("produce", async ({ kind, rtpParameters }, cb) => {
      const { id } = await new Promise<any>((res) =>
        socket.emit("produce", { kind, rtpParameters }, res)
      );
      cb({ id });
    });

    sendTransportRef.current = sendTransport;

    for (const track of stream.getTracks()) {
      await sendTransport.produce({ track });
    }

    const recvTransportData = await new Promise<any>((res) =>
      socket.emit("createRecvTransport", res)
    );

    const recvTransport = device.createRecvTransport(recvTransportData);

    recvTransport.on("connect", ({ dtlsParameters }, cb) => {
      socket.emit(
        "connectTransport",
        { dtlsParameters, isConsumer: true },
        cb
      );
    });

    recvTransportRef.current = recvTransport;

    const producerIds = await new Promise<string[]>((res) =>
      socket.emit("getProducers", res)
    );

    for (const producerId of producerIds) {
      await consume(producerId, recvTransport, device);
    }

    socket.on(
      "newProducer",
      async ({ producerId }: { producerId: string }) => {
        await consume(producerId, recvTransport, device);
      }
    );
  };

  const consume = async (
    producerId: string,
    recvTransport: types.Transport,
    device: mediasoupClient.Device
  ) => {
    const socket = socketRef.current;

    const consumerParams = await new Promise<any>((res) =>
      socket.emit(
        "consume",
        {
          producerId,
          rtpCapabilities: device.rtpCapabilities,
        },
        res
      )
    );

    const consumer = await recvTransport.consume({
      id: consumerParams.id,
      producerId: consumerParams.producerId,
      kind: consumerParams.kind,
      rtpParameters: consumerParams.rtpParameters,
    });

    const remoteMediaStream = remoteStream ?? new MediaStream();
    remoteMediaStream.addTrack(consumer.track);

    setRemoteStream(remoteMediaStream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteMediaStream;
    }
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
