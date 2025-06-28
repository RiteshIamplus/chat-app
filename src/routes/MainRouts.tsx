import React from "react";
import { Routes, Route } from "react-router-dom";

import LoginPage from "../Pages/loginPage";
import ChatList from "@/Pages/ChatListUI";
import GroupChatBox from "../Pages/GroupChatBox";
import CreateGroupForm from "../Pages/CreateGroup";
import PersonalChatPage from "@/Pages/PersonalChatPage";
import RedirectIfLoggedIn from "./RedirectIfLoggedIn";
import ProtectedRoute from "./ProtectedRoute";
// import VideoCall from "@/Pages/mediasoup/VideoCall";
// import AudioCall from "@/Pages/mediasoup/AudioCall";
import CallScreen from "@/Pages/mediasoup/CallScreen";



const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RedirectIfLoggedIn>
            <LoginPage />
          </RedirectIfLoggedIn>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfLoggedIn>
            <LoginPage />
          </RedirectIfLoggedIn>
        }
      />
      <Route
        path="/chatlist"
        element={
          <ProtectedRoute>
            <ChatList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:userId"
        element={
          <ProtectedRoute>
            <PersonalChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creategroup"
        element={
          <ProtectedRoute>
            <CreateGroupForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sohelgroupChats"
        element={
          <ProtectedRoute>
            <GroupChatBox groupId="6851255a4237491d28a8ad46" currentUserId="sohel001" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gayugroupChats"
        element={
          <ProtectedRoute>
            <GroupChatBox groupId="6851255a4237491d28a8ad46" currentUserId="gayu003" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/abcgroupChats"
        element={
          <ProtectedRoute>
            <GroupChatBox groupId="6851255a4237491d28a8ad46" currentUserId="abc006" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/videocall"
        element={
          <ProtectedRoute>
            <CallScreen  />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/audiocall"
        element={
          <ProtectedRoute>
            <AudioCall  />
          </ProtectedRoute>
        }
      /> */}

    </Routes>
  );
};

export default AuthRoutes;
