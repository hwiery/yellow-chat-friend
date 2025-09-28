import { useState } from "react";
import BottomNavigation from "@/components/Layout/BottomNavigation";
import FriendsList from "@/components/Friends/FriendsList";
import ChatsList from "@/components/Chats/ChatsList";
import MyProfile from "@/components/Profile/MyProfile";
import ChatRoom from "@/components/Chat/ChatRoom";
import Login from "@/components/Auth/Login";
import Settings from "@/components/Settings/Settings";
import ProfileEdit from "@/components/Profile/ProfileEdit";
import AddFriend from "@/components/Friends/AddFriend";
import FriendProfile from "@/components/Friends/FriendProfile";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  const [currentChat, setCurrentChat] = useState<{ chatId: string; friendName: string } | null>(null);
  const [currentScreen, setCurrentScreen] = useState<string>("main");
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState({
    name: "나의 프로필", 
    statusMessage: "YellowTalk에서 대화해요! 💬",
    avatar: "",
    userId: "yellowtalk_user123"
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentChat(null);
    setCurrentScreen("main");
    setActiveTab("friends");
  };

  const handleStartChat = (friendId: string, friendName: string) => {
    setCurrentChat({ chatId: friendId, friendName });
  };

  const handleChatSelect = (chatId: string, friendName: string) => {
    setCurrentChat({ chatId, friendName });
  };

  const handleBackToList = () => {
    setCurrentChat(null);
    setActiveTab("chats");
  };

  const handleAddFriend = () => {
    setCurrentScreen("addFriend");
  };

  const handleFriendProfile = (friend: any) => {
    setSelectedFriend(friend);
    setCurrentScreen("friendProfile");
  };

  const handleEditProfile = () => {
    setCurrentScreen("profileEdit");
  };

  const handleSettings = () => {
    setCurrentScreen("settings");
  };

  const handleBackToMain = () => {
    setCurrentScreen("main");
  };

  const handleSaveProfile = (profile: { name: string; statusMessage: string; avatar: string }) => {
    setCurrentUser({ ...currentUser, ...profile });
  };

  const handleAddFriendById = (friendId: string) => {
    // Mock friend addition logic
    console.log("Adding friend:", friendId);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Show different screens based on current state
  if (currentChat) {
    return (
      <div className="h-screen bg-background">
        <ChatRoom 
          friendName={currentChat.friendName}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  if (currentScreen === "settings") {
    return (
      <div className="h-screen bg-background">
        <Settings onBack={handleBackToMain} onLogout={handleLogout} />
      </div>
    );
  }

  if (currentScreen === "profileEdit") {
    return (
      <div className="h-screen bg-background">
        <ProfileEdit 
          onBack={handleBackToMain}
          currentProfile={currentUser}
          onSave={handleSaveProfile}
        />
      </div>
    );
  }

  if (currentScreen === "addFriend") {
    return (
      <div className="h-screen bg-background">
        <AddFriend 
          onBack={handleBackToMain}
          onAddFriend={handleAddFriendById}
        />
      </div>
    );
  }

  if (currentScreen === "friendProfile" && selectedFriend) {
    return (
      <div className="h-screen bg-background">
        <FriendProfile 
          friend={selectedFriend}
          onBack={handleBackToMain}
          onStartChat={handleStartChat}
        />
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "friends":
        return (
          <FriendsList 
            onStartChat={handleStartChat} 
            onAddFriend={handleAddFriend}
            onFriendProfile={handleFriendProfile}
          />
        );
      case "chats":
        return <ChatsList onChatSelect={handleChatSelect} />;
      case "profile":
        return (
          <MyProfile 
            onEditProfile={handleEditProfile}
            onSettings={handleSettings}
            onLogout={handleLogout}
            currentUser={currentUser}
          />
        );
      default:
        return (
          <FriendsList 
            onStartChat={handleStartChat} 
            onAddFriend={handleAddFriend}
            onFriendProfile={handleFriendProfile}
          />
        );
    }
  };

  return (
    <div className="h-screen bg-background pb-16">
      {renderActiveTab()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
