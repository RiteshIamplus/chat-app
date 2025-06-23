import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://192.168.1.10:5000');

type Message = {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
};

const SohelChatBox = ({ currentUserId, otherUserId }: { currentUserId: string, otherUserId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    socket.emit('join', { userId: currentUserId });

    axios.get(`http://192.168.1.10:5000/api/chat/messages/${currentUserId}/${otherUserId}`)
      .then(res => setMessages(res.data));

    socket.on('receiveMessage', (msg: Message) => {
      if (
        (msg.senderId === otherUserId && msg.receiverId === currentUserId)
      ) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [currentUserId, otherUserId]);

  const sendMessage = () => {
    const msg = {
      senderId: currentUserId,
      receiverId: otherUserId,
      message: newMessage
    };
    socket.emit('sendMessage', msg);
    setMessages(prev => [...prev, { ...msg, timestamp: new Date().toISOString() }]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen max-w-md w-full mx-auto bg-white dark:bg-black border rounded shadow-md my-16">

      {/* Header */}
      <div className="p-4 border-b bg-blue-600 text-white font-semibold text-lg">
        Chat with User
      </div>
  
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100 dark:bg-gray-800">
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
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
  
      {/* Input Box */}
      <div className="w-full px-2 fixed bottom-4 border-t dark:bg-gray-900 flex items-center gap-2 mt-auto">

        <input
          type="text"
          className="flex-1 p-2 border rounded-full focus:outline-none text-sm"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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
