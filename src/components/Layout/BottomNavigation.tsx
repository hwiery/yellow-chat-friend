import { Users, MessageCircle, User } from "lucide-react";
import { useState } from "react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const tabs = [
    { id: "friends", icon: Users, label: "친구" },
    { id: "chats", icon: MessageCircle, label: "대화" },
    { id: "profile", icon: User, label: "마이페이지" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-nav-background border-t border-border">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-2 min-w-16 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={24} className="mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;