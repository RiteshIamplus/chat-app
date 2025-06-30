import { BASE_URL } from "@/lib/baseUrl";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io, Socket } from "socket.io-client";

const SERVER_URL = BASE_URL;

const MediaCall = () => {
  const location = useLocation();
  const { callerId, receiverId, incoming, isVideo } = location.state;

  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
console.log(incoming,remoteStream)
  const roomId =
    callerId > receiverId
      ? `${callerId}-${receiverId}`
      : `${receiverId}-${callerId}`;

  useEffect(() => {
    const socket = io(SERVER_URL, { forceNew: true });
    socketRef.current = socket;

    setupSocketListeners(socket);
    startCall();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupSocketListeners = (socket: Socket) => {
    socket.off("signal");
    socket.on("signal", async ({ from, data }) => {
      if (data.type === "offer") {
        await peerRef.current?.setRemoteDescription(
          new RTCSessionDescription(data)
        );
        const answer = await peerRef.current?.createAnswer();
        await peerRef.current?.setLocalDescription(answer);
        socket.emit("signal", {
          roomId,
          to: from,
          data: peerRef.current?.localDescription,
        });
      } else if (data.type === "answer") {
        await peerRef.current?.setRemoteDescription(
          new RTCSessionDescription(data)
        );
      } else if (data.candidate) {
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.off("user-joined-call");
    socket.on("user-joined-call", (userId: string) => {
      createOffer(userId);
    });

    socket.off("user-left-call");
    socket.on("user-left-call", () => {
      console.log("📞 User left call");
      cleanup();
    });
  };

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    setLocalStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const peer = createPeer();
    peerRef.current = peer;

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    socketRef.current?.emit("joinCall", roomId);
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("signal", {
          roomId,
          to: receiverId,
          data: { candidate: e.candidate },
        });
      }
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    return peer;
  };

  const createOffer = async (userId: string) => {
    const offer = await peerRef.current?.createOffer();
    await peerRef.current?.setLocalDescription(offer);
    socketRef.current?.emit("signal", {
      roomId,
      to: userId,
      data: offer,
    });
  };

  const cleanup = () => {
    console.log("🛑 Cleaning up...");
    socketRef.current?.emit("leaveCall", roomId);
    socketRef.current?.disconnect();
    socketRef.current = null;

    peerRef.current?.close();
    peerRef.current = null;

    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
  };

  const endCall = () => {
    cleanup();
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
        onClick={endCall}
        className="bg-red-600 text-white px-6 py-2 rounded-xl"
      >
        End Call
      </button>
    </div>
  );
};

export default MediaCall;