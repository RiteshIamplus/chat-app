import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import API from "@/lib/axios";
import { BASE_URL } from "@/lib/baseUrl";

const socket = io(BASE_URL, { autoConnect: true });

type ChatType = "user" | "group";

type Message = {
  senderId: string;
  receiverId?: string;
  message: string;
  timestamp: string;
  messageType?: string;
  payload?: any;
};

type Props = {
  type: ChatType;
  currentUserId: string;
  otherUserId?: string;
  groupId?: string;
};

const UnifiedChatBox = ({ type, currentUserId, otherUserId, groupId }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatInfo, setChatInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUserId || (type === "user" && !otherUserId) || (type === "group" && !groupId))
      return;

    if (!socket.connected) socket.connect();

    if (type === "group" && groupId) {
      socket.emit("joinGroup", { groupId, userId: currentUserId });

      API.get(`/api/chatGroup/getGroupMsg/${groupId}`)
        .then((res) => setMessages(res.data.data || []))
        .finally(() => setLoading(false))
        .catch(console.error);

      const handleGroupMessage = (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      };

      socket.on("receiveGroupMessage", handleGroupMessage);
      return () => {
        socket.off("receiveGroupMessage", handleGroupMessage);
      };
    }

    if (type === "user" && otherUserId) {
      socket.emit("join", { userId: currentUserId });

      API.get(`/api/chat/messages/${currentUserId}/${otherUserId}`)
        .then((res) => setMessages(res.data || []))
        .finally(() => setLoading(false))
        .catch(console.error);

      API.get(`/api/chat/full-chat-list/${currentUserId}`)
        .then((res) => {
          const matched = res.data?.data?.find((chat: any) =>
            chat._id === otherUserId ||
            (Array.isArray(chat.participants) && chat.participants.includes(otherUserId))
          );
          setChatInfo(matched || null);
        })
        .catch(console.error);

      const handleUserMessage = (msg: Message) => {
        if (msg.senderId === otherUserId && msg.receiverId === currentUserId) {
          setMessages((prev) => [...prev, msg]);
        }
      };

      socket.on("receiveMessage", handleUserMessage);
      
      return () => {
        socket.off("receiveMessage", handleUserMessage);
      };
    }
  }, [type, currentUserId, otherUserId, groupId]);

  useEffect(() => {
    const timeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const timestamp = new Date().toISOString();

    if (type === "group" && groupId) {
      const msg = {
        groupId,
        senderId: currentUserId,
        message: newMessage,
        messageType: "text",
        timestamp,
      };
      socket.emit("sendGroupMessage", msg);
      setMessages((prev) => [...prev, msg]);
    }

    if (type === "user" && otherUserId) {
      const msg = {
        senderId: currentUserId,
        receiverId: otherUserId,
        message: newMessage,
        timestamp,
      };
      socket.emit("sendMessage", msg);
      setMessages((prev) => [...prev, msg]);
    }

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

  const formatLastSeen = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `last seen today at ${time}`;
    if (isYesterday) return `last seen yesterday at ${time}`;
    return `last seen on ${date.toLocaleDateString([], { day: "numeric", month: "short" })} at ${time}`;
  };

  return (
    <div className="flex flex-col h-screen max-w-md w-full mx-auto bg-white dark:bg-black border rounded shadow-md my-16 relative">
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-md z-30 bg-green-600 text-white font-semibold text-lg p-4 border-b">
        {type === "group" ? "Group Chat" : chatInfo?.userName || "Chat"}
        <div className="text-xs text-white/80 font-normal">
          {type === "user"
            ? (!chatInfo?.online && chatInfo?.last_seen
              ? formatLastSeen(chatInfo.last_seen)
              : "online")
            : ""}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-[88px] pb-24 px-4 space-y-2 bg-gray-100 dark:bg-gray-800">
        {loading ? (
          <div className="text-center text-sm text-gray-500 mt-10">Loading messages...</div>
        ) : (
          messages.map((msg, i) => (
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

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

export default UnifiedChatBox;
