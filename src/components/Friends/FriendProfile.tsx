import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Friend {
  id: string;
  name: string;
  statusMessage?: string;
  avatar?: string;
}

interface FriendProfileProps {
  friend: Friend;
  onBack: () => void;
  onStartChat: (friendId: string, friendName: string) => void;
}

const FriendProfile = ({ friend, onBack, onStartChat }: FriendProfileProps) => {
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
        <h1 className="text-xl font-bold">프로필</h1>
      </div>

      {/* Friend Profile Content */}
      <div className="flex-1 p-4">
        <Card className="border border-border">
          <CardContent className="p-6">
            {/* Profile Image - Clickable for zoom */}
            <div className="flex flex-col items-center space-y-4 mb-6">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-pointer">
                    <Avatar className="h-24 w-24 hover:opacity-80 transition-opacity">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback className="bg-yellow-light text-foreground text-2xl">
                        {friend.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-sm bg-background border border-border">
                  <div className="flex justify-center">
                    <Avatar className="h-64 w-64">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback className="bg-yellow-light text-foreground text-6xl">
                        {friend.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-xs text-muted-foreground">프로필 사진을 클릭하면 확대됩니다</p>
            </div>

            {/* Friend Info */}
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {friend.name}
                </h2>
                {friend.statusMessage && (
                  <p className="text-muted-foreground">
                    {friend.statusMessage}
                  </p>
                )}
              </div>

              {/* Chat Button */}
              <Button 
                onClick={() => onStartChat(friend.id, friend.name)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center space-x-2"
              >
                <MessageCircle size={18} />
                <span>대화하기</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FriendProfile;