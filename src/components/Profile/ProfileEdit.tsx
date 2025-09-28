import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { profileService } from "@/services/profile";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileEditProps {
  onBack: () => void;
  currentProfile: {
    name: string;
    statusMessage: string;
    avatar: string;
    userId: string;
  };
  onSave: (profile: { name: string; statusMessage: string; avatar: string }) => void;
}

const ProfileEdit = ({ onBack, currentProfile, onSave }: ProfileEditProps) => {
  const [name, setName] = useState(currentProfile.name);
  const [statusMessage, setStatusMessage] = useState(currentProfile.statusMessage);
  const [avatar, setAvatar] = useState(currentProfile.avatar);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { updateProfile } = useAuth();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "오류",
        description: "이름을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await profileService.updateProfile({
        display_name: name.trim(),
        status_message: statusMessage.trim(),
        avatar_url: avatar
      });

      if (error) throw error;

      await updateProfile({
        display_name: name.trim(),
        status_message: statusMessage.trim(),
        avatar_url: avatar
      });

      toast({
        title: "저장 완료",
        description: "프로필이 성공적으로 수정되었습니다."
      });
      onBack();
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "저장 실패",
        description: "프로필 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        setLoading(true);

        try {
          const { data: avatarUrl, error } = await profileService.uploadAvatar(file);

          if (error) throw error;

          setAvatar(avatarUrl || '');
          toast({
            title: "이미지 변경",
            description: "프로필 이미지가 변경되었습니다."
          });
        } catch (error) {
          console.error('Avatar upload error:', error);
          toast({
            title: "업로드 실패",
            description: "이미지 업로드 중 오류가 발생했습니다.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };

      input.click();
    } catch (error) {
      console.error('File input error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="mr-3"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">프로필 수정</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? "저장 중..." : "저장"}
        </Button>
      </div>

      {/* Profile Edit Form */}
      <div className="flex-1 p-4 space-y-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-yellow-light text-foreground text-2xl">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              onClick={handleImageUpload}
              disabled={loading}
              className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Camera size={14} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">프로필 사진을 변경하려면 카메라 버튼을 눌러주세요</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">상태 메시지</Label>
            <Textarea
              id="status"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="상태 메시지를 입력하세요"
              maxLength={100}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>내 아이디</Label>
            <div className="p-3 bg-muted/50 rounded-md border border-border">
              <p className="text-sm text-muted-foreground">{currentProfile.userId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;