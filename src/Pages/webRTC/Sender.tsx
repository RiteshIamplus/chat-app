import { BASE_URL } from "@/lib/baseUrl";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const SIGNALING_SERVER = BASE_URL;
const ROOM_ID = "file-transfer-room";
const USER_ID = uuidv4();

const Sender = () => {
  const socket = useRef<any>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  // const [file, setFile] = useState<File | null>(null);
  const [channelReady, setChannelReady] = useState(false);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<File[]>([]);

  useEffect(() => {
    socket.current = io(SIGNALING_SERVER, { transports: ["websocket"] });

    socket.current.emit("join-room", { roomId: ROOM_ID, userId: USER_ID });

    socket.current.on("user-joined", ({ userId }: { userId: string }) => {
        console.log("🎯 Receiver joined:", userId);
      setReceiverId(userId);
    });

    socket.current.on(
      "answer",
      async (data: { answer: RTCSessionDescriptionInit }) => {
        await peer.current?.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    );

    socket.current.on(
      "candidate",
      async (data: { candidate: RTCIceCandidateInit }) => {
        await peer.current?.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    );
  }, []);

  const startConnection = async () => {
    console.log("🚀 startConnection called");
  
    if (!receiverId) {
      console.warn("❌ receiverId not set yet");
      return;
    }
  
    peer.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  
    console.log("🔧 RTCPeerConnection created");
  
    dataChannel.current = peer.current.createDataChannel("file");
    console.log("📡 Data channel created");
  
    dataChannel.current.onopen = () => {
      console.log("✅ Data channel open");
      setChannelReady(true);
    };
  
    peer.current.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("📨 Sending ICE candidate");
        socket.current.emit("room-candidate", {
          candidate: e.candidate,
          to: receiverId,
          roomId: ROOM_ID,
          from: USER_ID,
        });
      }
    };
  
    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);
  
    console.log("📤 Sending offer to receiver");
  
    socket.current.emit("room-offer", {
      offer,
      to: receiverId,
      roomId: ROOM_ID,
      from: USER_ID,
    });
  };
  

  

  const sendFiles = () => {
    if (!fileList.length || !dataChannel.current) return;

    const chunkSize = 16 * 1024;

    const sendNextFile = (index: number) => {
      const file = fileList[index];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        // ✅ Send metadata first
        dataChannel.current!.send(JSON.stringify({ fileName: file.name }));

        const buffer = new Uint8Array(reader.result as ArrayBuffer);
        for (let i = 0; i < buffer.length; i += chunkSize) {
          dataChannel.current!.send(buffer.slice(i, i + chunkSize));
        }

        dataChannel.current!.send("EOF");

        //   console.log(📦 Sent file: ${file.name});

        // ✅ Send next file
        if (index + 1 < fileList.length) {
          setTimeout(() => sendNextFile(index + 1), 100); // slight delay to avoid congestion
        }
      };

      reader.readAsArrayBuffer(file);
    };

    sendNextFile(0); // start sending
  };

  return (
    <div>
      <h2>📤 Sender</h2>
      {!channelReady && (
  <button onClick={startConnection} disabled={!receiverId}>
    Start Connection
  </button>
)}

      {channelReady && (
        <>
          <input
            type="file"
            multiple
            onChange={(e) => setFileList(Array.from(e.target.files || []))}
          />
          <button onClick={sendFiles} disabled={!fileList.length}>
            Send Files
          </button>
        </>
      )}
    </div>
  );
};

export default Sender;
