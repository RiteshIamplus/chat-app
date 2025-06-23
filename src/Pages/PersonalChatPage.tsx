import { useParams } from 'react-router-dom';
import SohelChatBox from './Sohel';


const PersonalChatPage = () => {
  const { userId } = useParams();
//   console.log(userId)
  const userString = localStorage.getItem("user");
//   console.log(userString)
  const user = userString ? JSON.parse(userString) : null;

  console.log(userId)
  console.log(user.id)

  if (!user || !userId) return <p className="p-4">❌ User not found</p>;

  return (
    <div className="">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Chat with {userId}</h2>
      <SohelChatBox currentUserId={user._id} otherUserId={userId} />
    </div>
  );
};

export default PersonalChatPage;
