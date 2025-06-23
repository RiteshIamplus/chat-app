import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

import API from "@/lib/axios";

const socket = io("http://192:168:1:17:5000");

type Message = {
  senderId: string;
  message: string;
  timestamp: string;
  messageType?: string;
  payload?: any;
};

const GroupChatBox = ({
  groupId,
  currentUserId,
}: {
  groupId: string;
  currentUserId: string;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.emit("joinGroup", { groupId, userId: currentUserId });

    API.get(`/group-messages/${groupId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error loading messages:", err));

    socket.on("receiveGroupMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("groupError", (error: { message: string }) => {
      alert(error.message);
      console.warn("Group error:", error);
    });

    return () => {
      socket.off("receiveGroupMessage");
      socket.off("groupError");
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    //  enum: ['text', 'visitor', 'checkin', 'checkout', 'task', 'note', 'file'],
    socket.emit("sendGroupMessage", {
      groupId,
      senderId: currentUserId,
      message: newMessage,
      messageType: "task", // Example message type
      payload: {
        name: "sohwel tayde",
        phone: "999-123-4567",
        purpose: "Delivery",
        photoUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKH-a-tnSlIfXqCGJ5DU7sw2frDu5Wi28vGg&s",
      },
      timestamp: new Date().toISOString(),
    });

    setNewMessage("");
  };

  const renderMessage = (msg: Message) => {
    switch (msg.messageType) {
      case "text":
        return <p>{msg.message}</p>;
      case "visitor":
        return (
          <div className="bg-yellow-100 p-2 rounded">
            <div>
              <strong>Visitor:</strong> {msg.payload?.name} (
              {msg.payload?.phone})<br />
              Purpose: {msg.payload?.purpose}
            </div>
            <img src={msg.payload?.photoUrl} alt="" />
          </div>
        );
      case "checkin":
        return (
          <div className="text-green-700">
            ✅ Check-in at {msg.payload?.location}
          </div>
        );
      case "checkout":
        return (
          <div className="text-red-600">
            ⏱️ Check-out at {msg.payload?.location}
          </div>
        );
      case "task":
        return (
          <div className="bg-blue-100 p-2 rounded">
            📋 <strong>{msg.payload?.title}</strong>
            <br />
            Assigned to: {msg.payload?.assignedTo}
            <br />
            Deadline: {msg.payload?.deadline}
          </div>
        );
      case "file":
        return (
          <a
            href={msg.payload?.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            📎 {msg.payload?.fileName}
          </a>
        );
      default:
        return <p>{msg.message}</p>;
    }
  };

  return (
    <div className="p-4 border rounded max-w-md mx-auto">
      <div className="h-64 overflow-y-auto mb-2 bg-gray-100 p-2 rounded">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-1 my-1 rounded ${
              msg.senderId === currentUserId
                ? "text-right bg-green-200"
                : "text-left bg-gray-300"
            }`}
          >
            <p>
              <strong>{msg.senderId}:</strong>
            </p>
            {renderMessage(msg)}
            <small className="text-xs text-gray-600 block">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border px-2 py-1"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          className="bg-green-500 text-white px-4 py-1 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupChatBox;
