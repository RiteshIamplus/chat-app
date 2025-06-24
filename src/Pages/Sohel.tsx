import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import API from "@/lib/axios";
import { BASE_URL } from "@/lib/baseUrl";

type Message = {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
};

const SohelChatBox = ({
  currentUserId,
  otherUserId,
}: {
  currentUserId: string;
  otherUserId: string;
}) => {
  const [matchedChat, setMatchedChat] = useState<any | null>(null);

  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(io(BASE_URL)); // Socket initialized once
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // console.log(currentUserId)
  // console.log(otherUserId)
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    API.get(`/api/chat/full-chat-list/${currentUserId}`) // fetch currentUser's chats
      .then((res) => {
        const chats = res?.data?.data || [];

        console.log(chats);
        setContacts(chats);

        // Try to match chat where the other participant is `otherUserId`
        const matched = chats.find((chat: any) => {
          if (chat.type === "group") return false;

          // Match based on userId/participant (adjust based on your backend shape)
          return (
            chat._id === otherUserId ||
            (Array.isArray(chat.participants) &&
              chat.participants.includes(otherUserId))
          );
        });

        setMatchedChat(matched || null);
        console.log("✅ Matched Chat Object:", matched);
      })
      .catch((err) => {
        console.error(
          "❌ API Error:",
          err.response?.data || err.message || err
        );
      });
  }, [currentUserId, otherUserId]);

  const formatLastSeen = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `last seen today at ${time}`;
    } else if (isYesterday) {
      return `last seen yesterday at ${time}`;
    } else {
      const formattedDate = date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      });
      return `last seen on ${formattedDate} at ${time}`;
    }
  };

  useEffect(() => {
    const socket = socketRef.current;

    // Join socket room
    socket.emit("join", { userId: currentUserId });

    // Fetch previous messages
    API.get(`/api/chat/messages/${currentUserId}/${otherUserId}`)
      .then((res) => {
        // console.log(res)
        setMessages(res.data);
      })
      .catch(console.error);

    // Handle incoming messages
    const handleReceive = (msg: Message) => {
      if (msg.senderId === otherUserId && msg.receiverId === currentUserId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [currentUserId, otherUserId]);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const msg = {
      senderId: currentUserId,
      receiverId: otherUserId,
      message: newMessage,
    };

    socketRef.current.emit("sendMessage", msg);
    // For now, append local timestamp (better to rely on server's timestamp ideally)
    setMessages((prev) => [
      ...prev,
      { ...msg, timestamp: new Date().toISOString() },
    ]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen max-w-md w-full mx-auto bg-white dark:bg-black border rounded shadow-md my-16">
      {/* Header */}
      <div className="p-4 border-b bg-blue-600 text-white font-semibold text-lg">
        {matchedChat?.userName}
        <div className="text-xs text-gray-400">
          {!matchedChat?.online && matchedChat?.last_seen
            ? formatLastSeen(matchedChat.last_seen)
            : "online"}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100 dark:bg-gray-800 pb-20">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm ${
              msg.senderId === currentUserId
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-200 text-black"
            }`}
          >
            <p>{msg.message}</p>
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

      {/* Input Box */}
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default SohelChatBox;
