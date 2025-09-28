import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Settings, LogOut } from "lucide-react";

interface MyProfileProps {
  onEditProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  currentUser: {
    name: string;
    statusMessage: string;
    avatar: string;
    userId: string;
  };
}

const MyProfile = ({ onEditProfile, onSettings, onLogout, currentUser }: MyProfileProps) => {

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">마이페이지</h1>
        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings size={20} />
        </Button>
      </div>

      {/* Profile Card */}
      <div className="p-4">
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="bg-yellow-light text-foreground text-xl">
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {currentUser.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ID: {currentUser.userId}
                </p>
                {currentUser.statusMessage && (
                  <p className="text-sm text-muted-foreground">
                    {currentUser.statusMessage}
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4 border-primary text-primary hover:bg-yellow-light"
              onClick={onEditProfile}
            >
              프로필 수정
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-4 flex flex-col justify-end">
        <Button 
          variant="ghost" 
          className="w-full justify-start h-12 text-left text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut size={20} className="mr-3" />
          로그아웃
        </Button>
      </div>
    </div>
  );
};

export default MyProfile;