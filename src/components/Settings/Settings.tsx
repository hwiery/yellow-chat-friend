import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bell, UserMinus } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
}

const Settings = ({ onBack, onLogout }: SettingsProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleAccountDeletion = () => {
    // Mock account deletion
    alert("계정이 삭제되었습니다.");
    onLogout();
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
        <h1 className="text-xl font-bold">설정</h1>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Notification Settings */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell size={20} className="text-muted-foreground" />
                <div>
                  <h3 className="font-medium text-foreground">알림 설정</h3>
                  <p className="text-sm text-muted-foreground">메시지 알림 받기</p>
                </div>
              </div>
              <Switch 
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-left text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <UserMinus size={20} className="mr-3" />
                  <div>
                    <h3 className="font-medium">회원 탈퇴</h3>
                    <p className="text-sm text-muted-foreground">모든 데이터가 삭제됩니다</p>
                  </div>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>회원 탈퇴</AlertDialogTitle>
                  <AlertDialogDescription>
                    정말로 회원 탈퇴하시겠습니까?
                    <br />
                    모든 대화 내역과 친구 목록이 삭제되며, 복구할 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleAccountDeletion}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    탈퇴하기
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;