import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import API from "@/lib/axios";
import { BASE_URL } from "@/lib/baseUrl";
import Toast from "@/components/custom/toast/Toast";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState("");

  const [matchedChat, setMatchedChat] = useState<any | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(io(BASE_URL));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  console.log(contacts);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    API.get(`/api/chat/full-chat-list/${currentUserId}`)
      .then((res) => {
        const chats = res?.data?.data || [];
        setContacts(chats);

        const matched = chats.find((chat: any) => {
          if (chat.type === "group") return false;
          return chat._id === otherUserId;
        });

        setMatchedChat(matched || null);
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

    if (isToday) return `last seen today at ${time}`;
    if (isYesterday) return `last seen yesterday at ${time}`;

    const formattedDate = date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
    return `last seen on ${formattedDate} at ${time}`;
  };

  useEffect(() => {
    const socket = socketRef.current;

    socket.emit("userOnline", currentUserId); // ✅ Mark user online
    socket.emit("join", { userId: currentUserId }); // ✅ Join personal room

    // Fetch existing messages
    API.get(`/api/chat/messages/${currentUserId}/${otherUserId}`)
      .then((res) => {
        console.log(res.data);
        setMessages(res?.data.data);
      })
      .catch(console.error);

    // ✅ Handle real-time incoming messages
    // const handleReceive = (msg: Message) => {
    //   console.log(msg)
    //   if (
    //     msg.senderId === otherUserId &&
    //     msg.receiverId === currentUserId
    //   ) {
    //     setMessages((prev) => {
    //       console.log("Appending", msg, "to", prev);
    //       return [...prev, msg];
    //     });
    //   }
    // };

    // const handleReceive = (msg: Message) => {
    //   console.log("📩 New Message Received:", msg);
    //   setMessages((prev) => [...prev, msg]);
    // };
    const handleReceive = (msg: Message) => {
      console.log("📩 New Message Received:", msg);

      if (msg.senderId === otherUserId) {
        // 🔔 Play sound + toast
        const audio = new Audio("/sounds/new-notification-09-352705.mp3");
        audio
          .play()
          .catch((err) => console.warn("🔇 Autoplay blocked:", err.message));
        setToastMsg(`📨 ${msg.message}`);

        // ✅ Mark this message as read (only for incoming messages)
        API.post(`/api/chat/markRead/${currentUserId}`).catch((err) =>
          console.error("❌ Failed to mark chat as read", err)
        );
      }

      setMessages((prev) => [...prev, msg]);
    };

    socket.on("newMessageReceived", handleReceive);

    return () => {
      socket.off("newMessageReceived", handleReceive);
    };
  }, [currentUserId, otherUserId]);

  useEffect(scrollToBottom, [messages]);
  useEffect(() => {
    if (!currentUserId) return;

    const markChatAsRead = async () => {
      try {
        await API.post(`/api/chat/markRead/${currentUserId}`);
      } catch (err) {
        console.error("❌ Failed to mark chat as read", err);
      }
    };

    markChatAsRead(); // ✅ Only on mount
  }, [currentUserId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const msg = {
      senderId: currentUserId,
      receiverId: otherUserId,
      message: newMessage,
    };

    socketRef.current.emit("sendMessage", msg);
    setMessages((prev) => [
      ...prev,
      { ...msg, timestamp: new Date().toISOString() },
    ]);
    setNewMessage("");
  };
  const initiateCall = (isVideo: boolean) => {
    const socket = socketRef.current;
  
    socket.emit("startCall", {
      fromUserId: currentUserId,
      toUserId: otherUserId,
      isVideo,
    });
  
    navigate(isVideo ? "/videocall" : "/audiocall", {
      state: {
        callerId: currentUserId,
        receiverId: otherUserId,
        incoming: false,
        isVideo,
      },
    });
  };
  useEffect(() => {
    const socket = socketRef.current;
  
    // existing emits
    socket.emit("userOnline", currentUserId);
    socket.emit("join", { userId: currentUserId });
  
    // 🆕 Listen for incoming calls
    socket.on("incomingCall", ({ fromUserId, isVideo }) => {
      console.log("📞 Incoming Call from:", fromUserId);
  
      const ringtone = new Audio("/sounds/new-notification-09-352705.mp3");
      ringtone.loop = true;
      ringtone.play().catch((err) =>
        console.warn("🔇 Ringtone autoplay blocked", err)
      );
  
      const confirmCall = window.confirm(
        `${isVideo ? "Video" : "Audio"} call from ${fromUserId}. Accept?`
      );
  
      if (confirmCall) {
        ringtone.pause();
        navigate(isVideo ? "/videocall" : "/audiocall", {
          state: {
            callerId: fromUserId,
            receiverId: currentUserId,
            incoming: true,
            isVideo,
          },
        });
      } else {
        ringtone.pause();
        socket.emit("callDeclined", { toUserId: fromUserId });
      }
    });
  
    return () => {
      socket.off("incomingCall");
    };
  }, [currentUserId]);
  
  return (
    <div className="flex flex-col h-screen max-w-md w-full mx-auto bg-white dark:bg-black border rounded shadow-md my-16 relative">
      {/* Header */}
      <div className=" flex justify-between fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-md z-30 bg-blue-600 text-white font-semibold text-lg p-4 border-b">
        <div>
          <div>{matchedChat?.userName}</div>
          <div className="text-xs text-white/80 font-normal">
            {!matchedChat?.online && matchedChat?.last_seen
              ? formatLastSeen(matchedChat.last_seen)
              : "online"}
          </div>
        </div>
        <div>
          {/* <button
            onClick={() =>
              navigate("/videocall", {
                state: {
                  callerId: currentUserId,
                  receiverId: otherUserId,
                  incoming: false,
                  isVideo: true,
                },
              })
            }
          >
            videocll
          </button>
          <button onClick={() => navigate("/audiocall")}>audiocll</button> */}
          <button onClick={() => initiateCall(true)}>📹 Video Call</button>
<button onClick={() => initiateCall(false)}>🎧 Audio Call</button>

        </div>
      </div>

      {/* Messages */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      <div className="flex-1 overflow-y-auto pt-[88px] pb-24 px-4 space-y-2 bg-gray-100 dark:bg-gray-800">
        {messages?.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm ${
              msg.senderId === currentUserId
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-500 text-black"
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

export default SohelChatBox;
