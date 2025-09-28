import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { friendsService } from "@/services/friends";
import { FriendWithProfile } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  name: string;
  statusMessage?: string;
  avatar?: string;
  userId?: string;
}

interface FriendsListProps {
  onStartChat: (friendId: string, friendName: string) => void;
  onAddFriend: () => void;
  onFriendProfile: (friend: Friend) => void;
}

const FriendsList = ({ onStartChat, onAddFriend, onFriendProfile }: FriendsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const { data, error } = await friendsService.getFriends();

      if (error) throw error;

      // Transform FriendWithProfile to Friend interface
      const transformedFriends: Friend[] = data.map((friendData) => ({
        id: friendData.friend_profile.id,
        name: friendData.friend_profile.display_name,
        statusMessage: friendData.friend_profile.status_message || undefined,
        avatar: friendData.friend_profile.avatar_url || undefined,
        userId: friendData.friend_profile.user_id
      }));

      setFriends(transformedFriends);
    } catch (error) {
      console.error('Load friends error:', error);
      toast({
        title: "친구 목록 로드 실패",
        description: "친구 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">친구 목록을 불러오는 중...</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "검색 결과가 없습니다" : "친구가 없습니다"}
            </p>
            {!searchTerm && (
              <Button onClick={onAddFriend} className="bg-primary text-primary-foreground">
                첫 번째 친구 추가하기
              </Button>
            )}
          </div>
        ) : (
          filteredFriends.map((friend) => (
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
        ))
        )}
      </div>
    </div>
  );
};

export default FriendsList;