import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AddFriendProps {
  onBack: () => void;
  onAddFriend: (friendId: string) => void;
}

const AddFriend = ({ onBack, onAddFriend }: AddFriendProps) => {
  const [friendId, setFriendId] = useState("");
  const { toast } = useToast();

  const handleAddFriend = () => {
    if (!friendId.trim()) {
      toast({
        title: "오류",
        description: "친구 아이디를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    // Mock friend addition
    const mockFriends = ["yellowtalk123", "user456", "friend789", "chat2024"];
    
    if (mockFriends.includes(friendId.toLowerCase())) {
      onAddFriend(friendId);
      toast({
        title: "친구 추가 완료",
        description: `${friendId}님을 친구로 추가했습니다.`
      });
      onBack();
    } else {
      toast({
        title: "친구 찾기 실패",
        description: "존재하지 않는 아이디입니다.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddFriend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold">친구 추가</h1>
      </div>

      {/* Add Friend Form */}
      <div className="flex-1 p-4">
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-4">
              <UserPlus size={24} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">친구 추가</h2>
            <p className="text-sm text-muted-foreground">
              친구의 YellowTalk 아이디를 입력해서 친구를 추가해보세요
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="friendId">친구 아이디</Label>
              <Input
                id="friendId"
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="예: yellowtalk123"
                className="text-center"
              />
            </div>

            <Button 
              onClick={handleAddFriend}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!friendId.trim()}
            >
              친구 추가
            </Button>
          </div>

          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">테스트용 아이디</h3>
            <p className="text-sm text-muted-foreground">
              다음 아이디들로 테스트해보세요:
              <br />
              yellowtalk123, user456, friend789, chat2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;