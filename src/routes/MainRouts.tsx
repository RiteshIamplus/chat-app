import GroupChatBox from "../Pages/GroupChatBox";
import AjayChatBox from "../Pages/Ajay";
import SohelChatBox from "../Pages/Sohel";
import React from "react";
import { Routes, Route } from "react-router-dom";
import CreateGroupForm from "../Pages/CreateGroup";

import LoginPage from "../Pages/loginPage";
import ChatList from "@/Pages/ChatListUI";
import MainChatPage from "../Pages/MainChatPage";
import PersonalChatPage from "@/Pages/PersonalChatPage";


const AuthRoutes: React.FC = () => {
  return (
    <Routes>
   
      <Route path="/" element={<ChatList />} />
      {/* <Route path="/ajay" element={<AjayChatBox currentUserId="ajay002" otherUserId="sohel001" />} /> */}
      <Route path="/ajaygroupChats" element={<GroupChatBox groupId="6851255a4237491d28a8ad46"  currentUserId="ajay002"/>} />
      <Route path="/sohelgroupChats" element={<GroupChatBox groupId="6851255a4237491d28a8ad46"  currentUserId="sohel001"/>} />
      <Route path="/gayugroupChats" element={<GroupChatBox groupId="6851255a4237491d28a8ad46"  currentUserId="gayu003"/>} />
      <Route path="/abcgroupChats" element={<GroupChatBox groupId="6851255a4237491d28a8ad46"  currentUserId="abc006"/>} />
      <Route path="/creategroup" element={<CreateGroupForm />} />
      
       <Route path="/login" element={<LoginPage />} />
       <Route path="/chatlist" element={<ChatList />} />
       <Route path="/chat/:userId" element={<PersonalChatPage />} />
    </Routes>
    // <Routes>
    //   {/* 1-to-1 dynamic chat route */}
    //   <Route path="/chat/:currentUserId/:otherUserId" element={<SohelChatBox/>} />

    //   {/* Group chat dynamic route */}
    //   <Route path="/groupchat/:groupId/:currentUserId" element={<GroupChatBox/>} />

    //   {/* Create Group Route */}
    //   <Route path="/creategroup" element={<CreateGroupForm />} />
    // </Routes>
  );
};

export default AuthRoutes;