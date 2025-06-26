import { useParams } from "react-router-dom";
import SohelChatBox from "./Sohel";
import { useLocation } from "react-router-dom";
import GroupChatBox from "./GroupChatBox";

const PersonalChatPage = () => {
  const { userId } = useParams();

  const location = useLocation();
  const chatTypeFromState = location.state?.type;
  console.log(chatTypeFromState);

  //   console.log(userId)
  const userString = localStorage.getItem("user");
  //   console.log(userString)
  const user = userString ? JSON.parse(userString) : null;

  // console.log(userId)
  // console.log(user.id)
  // console.log(user)

  if (!user || !userId) return <p className="p-4">❌ User not found</p>;

  return (
    <div className="">
      <h2 className="text-xl font-bold mb-4 text-blue-600">
        Chat with {userId}
      </h2>
      {chatTypeFromState == "group" ? (
        <GroupChatBox groupId={userId} currentUserId={user._id} />
      
      ) : (
        <SohelChatBox currentUserId={user._id} otherUserId={userId} />
      )}
    </div>
  );
};

export default PersonalChatPage;
