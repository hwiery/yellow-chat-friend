import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import AuthDebug from "@/components/Debug/AuthDebug";

const Index = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("friends");
  const [currentChat, setCurrentChat] = useState<{ chatId: string; friendId?: string; friendName: string } | null>(null);
  const [currentScreen, setCurrentScreen] = useState<string>("main");
  const [selectedFriend, setSelectedFriend] = useState<{
    id: string;
    display_name: string;
    user_id: string;
    status_message?: string;
    avatar_url?: string;
  } | null>(null);

  const handleLogin = () => {
    // Auth is handled by AuthProvider
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentChat(null);
    setCurrentScreen("main");
    setActiveTab("friends");
  };

  const handleStartChat = (friendId: string, friendName: string) => {
    setCurrentChat({ chatId: friendId, friendId, friendName });
  };

  const handleChatSelect = (chatId: string, friendName: string) => {
    setCurrentChat({ chatId, friendName, friendId: undefined });
  };

  const handleBackToList = () => {
    setCurrentChat(null);
    setActiveTab("chats");
  };

  const handleAddFriend = () => {
    setCurrentScreen("addFriend");
  };

  const handleFriendProfile = (friend: {
    id: string;
    display_name: string;
    user_id: string;
    status_message?: string;
    avatar_url?: string;
  }) => {
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
    // Profile updates are handled by AuthProvider and ProfileEdit component
  };

  const handleAddFriendById = (friendId: string) => {
    // Friend addition is handled by AddFriend component
    // Reload friends list when coming back
    setActiveTab("friends");
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <Login onLogin={handleLogin} />;
  }

  // Show different screens based on current state
  if (currentChat) {
    return (
      <div className="h-screen bg-background">
        <ChatRoom
          friendName={currentChat.friendName}
          friendId={currentChat.friendId}
          conversationId={currentChat.friendId ? undefined : currentChat.chatId}
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
          currentProfile={{
            name: userProfile.display_name,
            statusMessage: userProfile.status_message || '',
            avatar: userProfile.avatar_url || '',
            userId: userProfile.user_id
          }}
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
            currentUser={{
              name: userProfile.display_name,
              statusMessage: userProfile.status_message || '',
              avatar: userProfile.avatar_url || '',
              userId: userProfile.user_id
            }}
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
      <AuthDebug />
    </div>
  );
};

export default Index;
