import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { friendsService } from "@/services/friends";

interface AddFriendProps {
  onBack: () => void;
  onAddFriend: (friendId: string) => void;
}

const AddFriend = ({ onBack, onAddFriend }: AddFriendProps) => {
  const [friendId, setFriendId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddFriend = async () => {
    if (!friendId.trim()) {
      toast({
        title: "오류",
        description: "친구 아이디를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 AddFriend: Starting friend add process...');

      const { data, error } = await friendsService.addFriend(friendId.trim());

      if (error) {
        console.error('❌ AddFriend: Error received:', error);

        // Handle specific error messages
        if (error.message?.includes('not found')) {
          toast({
            title: "친구 찾기 실패",
            description: `"${friendId.trim()}" 아이디의 사용자를 찾을 수 없습니다.`,
            variant: "destructive"
          });
        } else if (error.message?.includes('already friends')) {
          toast({
            title: "이미 친구입니다",
            description: "이미 친구로 추가된 사용자입니다.",
            variant: "destructive"
          });
        } else if (error.message?.includes('yourself')) {
          toast({
            title: "자기 자신은 친구로 추가할 수 없습니다",
            description: "다른 사용자의 아이디를 입력해주세요.",
            variant: "destructive"
          });
        } else if (error.message?.includes('authenticated')) {
          toast({
            title: "로그인이 필요합니다",
            description: "로그인 후 다시 시도해주세요.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "친구 추가 실패",
            description: error.message || "친구 추가 중 오류가 발생했습니다.",
            variant: "destructive"
          });
        }
        return;
      }

      console.log('✅ AddFriend: Success!');
      onAddFriend(friendId);
      toast({
        title: "친구 추가 완료",
        description: `${friendId.trim()}님을 친구로 추가했습니다.`
      });

      // Clear the input and go back
      setFriendId("");
      onBack();
    } catch (error) {
      console.error('❌ AddFriend: Unexpected error:', error);
      toast({
        title: "친구 추가 실패",
        description: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      console.log('🔄 AddFriend: Clearing loading state');
      setLoading(false);
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
              disabled={!friendId.trim() || loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "추가 중..." : "친구 추가"}
            </Button>
          </div>

          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">친구 찾기 팁</h3>
            <p className="text-sm text-muted-foreground">
              친구의 YellowTalk 아이디를 정확히 입력해주세요.
              <br />
              아이디는 프로필에서 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;