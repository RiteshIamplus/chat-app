import  { useState } from 'react';
import SohelChatBox from './Sohel';

import API from '@/lib/axios';

const MainChatPage = () => {
  const [query, setQuery] = useState('');
//   type User = { id: string; username: string; phone_number: string };
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedUserID, setSelectedUser] = useState< any>(null); // 👈 for selected user

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  // 🧪 Dummy user data
  const users = [
    { id: '00001', username: 'Ajay', phone_number: '7898079499' },
    { id: '00002', username: 'Rahul', phone_number: '9812345678' },
    { id: '00003', username: 'Sneha', phone_number: '7000112233' },
  ];
console.log(users)
  const handleSearch = async () => {
    // const result = users.find((user) => user.phone_number === query.trim());
    try {
const res = await API.get(`/api/auth/search?phone_number=${query}`);
// setResults(res.data);
console.log("Search Result:", res.data);
if(res){
       setSearchResult(res.data?.result);
      setNotFound(false);
}
} catch (err) {
     setNotFound(true);
console.error('Search failed:', err);
}
    // if (result) {
        
    //   setSearchResult(result);
    //   setNotFound(false);
    // } else {
    //   setSearchResult(null);
    //   setNotFound(true);
    // }
  };

  const handleSelect = () => {
    if (searchResult) {
      setSelectedUser(searchResult._id); // 👈 Set selected user
      setSearchResult(null);         // 👈 Close search result
      setQuery('');                  // Optional: clear input
      setNotFound(false);
    }
  };
console.log("Selected User ID:", selectedUserID);
console.log("Currunt User ID:", user?._id);
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">📱 Search User by Phone</h1>

     
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Enter phone number (e.g. 7898079499)"
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
     

      {searchResult && (
        <div className="bg-white border p-3 rounded mb-4">
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
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded mb-4">
          ❌ No user found with that number.
        </div>
      )}

       
        <SohelChatBox currentUserId={user?._id} otherUserId={selectedUserID} />
     
    </div>
  );
};

export default MainChatPage;
