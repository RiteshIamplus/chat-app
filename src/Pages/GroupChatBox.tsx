import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import API from "@/lib/axios";
import { BASE_URL } from "@/lib/baseUrl";

const socket = io(BASE_URL);

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
  const [groupInfo] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!groupId || !currentUserId) return;

    socket.emit("joinGroup", { groupId, userId: currentUserId });

    API.get(`api/chatGroup/getGroupMsg/${groupId}`)
      .then((res) =>{ 
        // console.log(res.data) 
        setMessages(res?.data?.data)})
      .catch((err) => console.error("Error loading messages:", err));

    // API.get(`/group-info/${groupId}`)
    //   .then((res) => setGroupInfo(res.data))
    //   .catch(console.warn);

    const receiveGroupMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receiveGroupMessage", receiveGroupMessage);
    socket.on("groupError", (err) => alert(err.message));

    return () => {
      socket.off("receiveGroupMessage", receiveGroupMessage);
      socket.off("groupError");
    };
  }, [groupId, currentUserId]);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    socket.emit("sendGroupMessage", {
      groupId,
      senderId: currentUserId,
      message: newMessage,
      messageType: "text",
      timestamp: new Date().toISOString(),
    });

    setMessages((prev) => [
      ...prev,
      {
        senderId: currentUserId,
        message: newMessage,
        messageType: "text",
        timestamp: new Date().toISOString(),
      },
    ]);

    setNewMessage("");
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.messageType) {
      case "visitor":
        return (
          <div className="bg-yellow-100 p-2 rounded">
            <strong>Visitor:</strong> {msg.payload?.name} ({msg.payload?.phone})
            <br />
            Purpose: {msg.payload?.purpose}
            {msg.payload?.photoUrl && (
              <img src={msg.payload?.photoUrl} alt="Visitor" className="mt-2 rounded w-20" />
            )}
          </div>
        );
      case "checkin":
        return (
          <div className="text-green-700 font-medium">
            ✅ Checked in at {msg.payload?.location}
          </div>
        );
      case "checkout":
        return (
          <div className="text-red-600 font-medium">
            ⏱️ Checked out at {msg.payload?.location}
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
    <div className="flex flex-col h-screen max-w-md w-full mx-auto bg-white dark:bg-black border rounded shadow-md my-16">
      {/* Header */}
      <div className="p-4 border-b bg-green-600 text-white font-semibold text-lg">
        {groupInfo?.name || "Group Chat"}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100 dark:bg-gray-800 pb-20">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm ${
              msg.senderId === currentUserId
                ? "ml-auto bg-green-500 text-white"
                : "mr-auto bg-gray-200 text-black"
            }`}
          >
            {renderMessageContent(msg)}
            <div className="text-[10px] text-right text-white/70 dark:text-gray-400 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="w-full px-2 py-2 bg-white dark:bg-gray-900 border-t flex items-center gap-2 fixed bottom-0 max-w-md">
        <input
          type="text"
          className="flex-1 p-2 border rounded-full focus:outline-none text-sm"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupChatBox;
