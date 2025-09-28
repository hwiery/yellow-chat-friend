import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Chat {
  id: string;
  friendId: string;
  friendName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
}

const mockChats: Chat[] = [
  {
    id: "1",
    friendId: "1",
    friendName: "김민수",
    lastMessage: "네, 알겠습니다!",
    lastMessageTime: "오후 3:24",
    unreadCount: 2,
    avatar: ""
  },
  {
    id: "2",
    friendId: "2", 
    friendName: "박지혜",
    lastMessage: "오늘 카페에서 만날까요?",
    lastMessageTime: "오후 1:15",
    unreadCount: 0,
    avatar: ""
  },
  {
    id: "3",
    friendId: "3",
    friendName: "이준호",
    lastMessage: "프로젝트 관련해서 이야기해요",
    lastMessageTime: "오전 11:30",
    unreadCount: 1,
    avatar: ""
  }
];

interface ChatsListProps {
  onChatSelect: (chatId: string, friendName: string) => void;
}

const ChatsList = ({ onChatSelect }: ChatsListProps) => {
  const [chats, setChats] = useState(mockChats);
  const { toast } = useToast();

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats(chats.filter(chat => chat.id !== chatId));
    toast({
      title: "대화방 삭제",
      description: "대화방이 삭제되었습니다."
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">대화</h1>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat.id, chat.friendName)}
            className="flex items-center p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={chat.avatar} />
              <AvatarFallback className="bg-yellow-light text-foreground">
                {chat.friendName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 ml-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{chat.friendName}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {chat.lastMessageTime}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground truncate flex-1">
                  {chat.lastMessage}
                </p>
                {chat.unreadCount > 0 && (
                  <Badge 
                    className="ml-2 bg-primary text-primary-foreground text-xs min-w-5 h-5 flex items-center justify-center"
                  >
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatsList;