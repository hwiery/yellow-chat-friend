import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Settings, Bell, Moon, LogOut } from "lucide-react";

const MyProfile = () => {
  const user = {
    name: "나의 프로필",
    statusMessage: "YellowTalk에서 대화해요! 💬",
    avatar: ""
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">마이페이지</h1>
        <Button variant="ghost" size="sm">
          <Settings size={20} />
        </Button>
      </div>

      {/* Profile Card */}
      <div className="p-4">
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-yellow-light text-foreground text-xl">
                  나
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {user.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.statusMessage}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4 border-primary text-primary hover:bg-yellow-light"
            >
              프로필 수정
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-4 space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start h-12 text-left"
        >
          <Bell size={20} className="mr-3" />
          알림 설정
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start h-12 text-left"
        >
          <Moon size={20} className="mr-3" />
          테마 설정
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start h-12 text-left text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} className="mr-3" />
          로그아웃
        </Button>
      </div>
    </div>
  );
};

export default MyProfile;