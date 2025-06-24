import { useParams, useLocation } from "react-router-dom";
import UnifiedChatBox from "./UnifiedChatBox"; // Ensure this is your merged component

const PersonalChatPage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const chatTypeFromState = location.state?.type;

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  if (!user || !userId) return <p className="p-4">❌ User not found</p>;

  return (
    <div className="">
      <h2 className="text-xl font-bold mb-4 text-blue-600">
        Chat with {userId}
      </h2>

      <UnifiedChatBox
        type={chatTypeFromState === "user" ? "user" : "group"}
        currentUserId={user._id}
        {...(chatTypeFromState === "user"
          ? { otherUserId: userId }
          : { groupId: userId })}
      />
    </div>
  );
};

export default PersonalChatPage;
