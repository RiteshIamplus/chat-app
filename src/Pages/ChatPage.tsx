import  { useEffect, useState } from "react";
import socket from "../socket";

type Message = {
  sender: string;
  message: string;
  room: string;
  time: string;
};

const ChatPage: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [chat, setChat] = useState<Message[]>([]);
  const room = "room1";

  useEffect(() => {
    socket.emit("join_room", room);

    socket.on("receive_message", (data: Message) => {
      setChat((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    const data: Message = {
      message,
      room,
      sender: "Ajay",
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", data);
    setChat((prev) => [...prev, data]);
    setMessage("");
  };

  return (
    <div className="p-4">
      <h2>Chat Room</h2>
      <div className="chat-box bg-gray-100 p-2 h-64 overflow-auto mb-4 rounded">
        {chat.map((msg, i) => (
          <div key={i}>
            <strong>{msg.sender}</strong>: {msg.message} <span>({msg.time})</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
