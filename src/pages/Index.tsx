import { useState } from "react";
import BottomNavigation from "@/components/Layout/BottomNavigation";
import FriendsList from "@/components/Friends/FriendsList";
import ChatsList from "@/components/Chats/ChatsList";
import MyProfile from "@/components/Profile/MyProfile";
import ChatRoom from "@/components/Chat/ChatRoom";

const Index = () => {
  const [activeTab, setActiveTab] = useState("friends");
  const [currentChat, setCurrentChat] = useState<{ chatId: string; friendName: string } | null>(null);

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

  // Show chat room if a chat is selected
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case "friends":
        return <FriendsList onStartChat={handleStartChat} />;
      case "chats":
        return <ChatsList onChatSelect={handleChatSelect} />;
      case "profile":
        return <MyProfile />;
      default:
        return <FriendsList onStartChat={handleStartChat} />;
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
