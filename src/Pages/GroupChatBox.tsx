import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import API from "@/lib/axios";
import { BASE_URL } from "@/lib/baseUrl";
import Toast from "@/components/custom/toast/Toast";

const socket = io(BASE_URL);

type Message = {
  senderId: string;
  message: string;
  senderName?:string;
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
  const [groupName, setGroupName] = useState("Group Chat");
  const [groupStatus, setGroupStatus] = useState("No group status set");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [toastMsg, setToastMsg] = useState("");
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!groupId || !currentUserId) return;

    socket.emit("joinGroup", { groupId, userId: currentUserId });

    // ✅ Fetch group messages
    API.get(`/api/chatGroup/getGroupMsg/${groupId}`)
      .then((res) => setMessages(res?.data?.data || []))
      .catch((err) => console.error("Error loading messages:", err));

    // ✅ Fetch full chat list to get group name and status
    API.get(`/api/chat/full-chat-list/${currentUserId}`)
      .then((res) => {
        const chats = res?.data?.data || [];
        console.log(chats);
        const groupChat = chats.find(
          (chat: any) => chat.type === "group" && chat._id === groupId
        );
        if (groupChat?.name) setGroupName(groupChat.name);
        if (groupChat?.group_status_message)
          setGroupStatus(groupChat.group_status_message);
      })
      .catch((err) => console.error("Error getting group info:", err));

      const receiveGroupMessage = (msg: Message) => {
        // ✅ Play sound
        const audio = new Audio("/sounds/new-notification-09-352705.mp3");
        audio.play().catch((err) =>
          console.warn("🔇 Autoplay blocked:", err.message)
        );
      
        setToastMsg(`📨 ${msg.message}`);
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
  useEffect(() => {
    const markChatAsRead = async () => {
      try {
        await API.post(`/api/chat/markRead/${currentUserId}/${groupId}`);
      } catch (err) {
        console.error("❌ Failed to mark chat as read", err);
      }
    };

    markChatAsRead(); // ✅ Call it
  }, [messages]);
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
console.log(messages)
  const renderMessageContent = (msg: Message) => {
    // console.log(msg)
    switch (msg.messageType) {
      case "visitor":
        return (
          <div className="bg-yellow-100 p-2 rounded">
            <strong>Visitor:</strong> {msg.payload?.name} ({msg.payload?.phone})
            <br />
            Purpose: {msg.payload?.purpose}
            {msg.payload?.photoUrl && (
              <img
                src={msg.payload?.photoUrl}
                alt="Visitor"
                className="mt-2 rounded w-20"
              />
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
          return (
            <div>
              {msg.senderId !== currentUserId && (
                <p className="text-md text-yellow-950 font-bold">{msg?.senderName}</p>
              )}
              <p>{msg.message}</p>
            </div>
          );
        
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md w-full mx-auto bg-white dark:bg-black border rounded shadow-md my-16 relative">
      {/* Header */}
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-md z-30 bg-blue-600 text-white font-semibold text-lg p-4 border-b">
        <div>{groupName}</div>
        <div className="text-xs text-white/80 font-normal">{groupStatus}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-[88px] pb-24 px-4 space-y-2 bg-gray-100 dark:bg-gray-800">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm ${
              msg.senderId === currentUserId
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-500 text-white"
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
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupChatBox;
