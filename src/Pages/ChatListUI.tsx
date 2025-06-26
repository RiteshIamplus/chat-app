import  { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import API from "@/lib/axios";
import { BASE_URL } from "@/lib/baseUrl";
import { io } from "socket.io-client";
import Toast from "@/components/custom/toast/Toast";

const socket = io(BASE_URL);
const ChatList = () => {
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedUserID] = useState<string | null>(null);
console.log(selectedUserID)
console.log(contacts)
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
// console.log(user)
useEffect(() => {
  if (!user?._id) return;

  const groupID = localStorage.getItem("groupID");

  const fetchChatList = () => {
    API.get(`/api/chat/full-chat-list/${user._id}?markRead=false`)
      .then((res) => {
        setContacts(res?.data?.data || []);
      })
      .catch((err) => {
        console.error("❌ Error fetching chat list:", err.response?.data || err.message);
      });
  };

  // ✅ Socket join and listeners
  socket.emit("join", { userId: user._id });
  socket.emit("joinGroup", { groupId: groupID, userId: user._id });

  socket.on("newUnreadMessage", ({ from,msg }) => {
    console.log("📩 Real-time update from", from);
    fetchChatList();
    const audio = new Audio("/sounds/new-notification-09-352705.mp3");
        audio.play().catch((err) =>
          console.warn("🔇 Autoplay blocked:", err.message)
        );
        setToastMsg(`📨 ${msg?.message || "New message"}`);
  });

  socket.on("newGroupCreated", (data) => {
    console.log("🆕 New group created", data.group);
    fetchChatList();
  });

  return () => {
    socket.off("newUnreadMessage");
    socket.off("newGroupCreated");
    socket.off("groupError");
  };
}, [user?._id]);

// ✅ Default fetch on initial render (markRead = true)
useEffect(() => {
  if (!user?._id) return;

  API.get(`/api/chat/full-chat-list/${user._id}?markRead=true`)
    .then((res) => {
      // console.log("📥 Initial chat list (markRead=true):", res.data.data);
      setContacts(res?.data?.data || []);
    })
    .catch((err) => {
      console.error("❌ API Error:", err.response?.data || err.message);
    });
}, [user?._id]);

  

  const handleSearch = async () => {
    try {
      const res = await API.get(`/api/auth/search?phone_number=${query}`);
      if (res.data?.result) {
        setSearchResult(res.data.result);
        setNotFound(false);
      } else {
        setSearchResult(null);
        setNotFound(true);
      }
    } catch {
      setSearchResult(null);
      setNotFound(true);
    }
  };

  const handleSelect = () => {
    if (searchResult) {
      navigate(`/chat/${searchResult._id}`);
    }
  };

  

  const renderChatCard = (item: any) => {
    const isGroup = item.type === "group";
    const displayName = isGroup ? item.name : item.userName;
    const initials = displayName?.[0] || "?";
    const lastMsg = item?.lastMsg?.message || "";
    // const lastSeen = !item.online ? item.last_seen : "";
    const unread = item?.unreadCount > 0 ;
    // console.log(item?.unreadCount)

    return (
      <div
        key={item._id}
        onClick={
          
          async () => {
          // try {
          //   await API.post(`/api/chat/markRead/${user._id}`, {
          //     chatId: item._id,
          //   });
          // } catch (err) {
          //   console.error("❌ Failed to mark chat as read", err);
          // }
        
          navigate(`/chat/${item._id}`, {
            state: { type: item.type, participants: item.participants }
          });
        }}
        

        className="flex items-center gap-3 p-3 rounded hover:bg-muted cursor-pointer transition"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
          ${isGroup ? 'bg-green-500 dark:bg-green-700' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{displayName}</div>
          <div className="text-xs text-gray-500 truncate">{lastMsg}</div>
        </div>
        {unread && (
          <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {item?.unreadCount}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col md:flex-row bg-white dark:bg-black my-16">
      <div className="w-full   border-r border-gray-200 dark:border-gray-800">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter phone number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>
          {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
          {searchResult && (
            <div className="bg-white dark:bg-gray-900 mt-3 p-3 rounded border">
              <p className="font-semibold text-green-700">✅ User Found:</p>
              <p>Name: {searchResult.userName}</p>
              <p>Phone: {searchResult.phone_number}</p>
              <button
                onClick={handleSelect}
                className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Select
              </button>
            </div>
          )}

          {notFound && (
            <div className="mt-2 bg-red-100 text-red-700 px-3 py-2 rounded">
              ❌ No user found.
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="h-full flex flex-col">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          {/* All */}
          <TabsContent value="all" className="flex-1 overflow-y-auto">
            <ScrollArea className="h-full p-2 space-y-2">
              <div className="text-xs font-semibold text-gray-500 px-2">Chats</div>
              {contacts.length>0 && contacts.map(renderChatCard)}
            </ScrollArea>
          </TabsContent>

          {/* Groups */}
          <TabsContent value="groups" className="flex-1 overflow-y-auto">
            <ScrollArea className="h-full p-2 space-y-2">
              <div className="text-xs font-semibold text-gray-500 px-2">Groups</div>
              {contacts
                .filter((c) => c.type === "group")
                .map(renderChatCard)}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Group Button */}
      <div className="w-full fixed bottom-4 px-4 py-2 flex justify-end z-50">
        <button
          onClick={() => navigate("/creategroup")}
          className="px-4 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          + Add Group
        </button>
      </div>
    </div>
  );
};

export default ChatList;
