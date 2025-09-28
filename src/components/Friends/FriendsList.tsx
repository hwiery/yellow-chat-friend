import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, MessageCircle } from "lucide-react";
import { useState } from "react";

interface Friend {
  id: string;
  name: string;
  statusMessage?: string;
  avatar?: string;
}

const mockFriends: Friend[] = [
  {
    id: "1",
    name: "김민수",
    statusMessage: "오늘도 좋은 하루 되세요!",
    avatar: ""
  },
  {
    id: "2", 
    name: "박지혜",
    statusMessage: "카페에서 공부중 📚",
    avatar: ""
  },
  {
    id: "3",
    name: "이준호", 
    statusMessage: "새로운 프로젝트 시작!",
    avatar: ""
  },
  {
    id: "4",
    name: "최수진",
    statusMessage: "오늘은 맑음 ☀️",
    avatar: ""
  }
];

interface FriendsListProps {
  onStartChat: (friendId: string, friendName: string) => void;
  onAddFriend: () => void;
  onFriendProfile: (friend: Friend) => void;
}

const FriendsList = ({ onStartChat, onAddFriend, onFriendProfile }: FriendsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFriends = mockFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">친구</h1>
        <Button variant="ghost" size="sm" onClick={onAddFriend}>
          <UserPlus size={20} />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="이름으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onFriendProfile(friend)}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={friend.avatar} />
              <AvatarFallback className="bg-yellow-light text-foreground">
                {friend.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 ml-3">
              <h3 className="font-medium text-foreground">{friend.name}</h3>
              {friend.statusMessage && (
                <p className="text-sm text-muted-foreground mt-1">
                  {friend.statusMessage}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStartChat(friend.id, friend.name);
              }}
              className="text-primary hover:bg-yellow-light"
            >
              <MessageCircle size={18} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsList;