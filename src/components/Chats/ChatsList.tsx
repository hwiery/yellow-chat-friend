import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { messagesService } from "@/services/messages";
import type { ConversationWithMessages } from "@/lib/supabase";

interface Chat {
  id: string;
  friendId: string;
  friendName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
}


interface ChatsListProps {
  onChatSelect: (chatId: string, friendName: string) => void;
}

const ChatsList = ({ onChatSelect }: ChatsListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await messagesService.getConversations();

      if (error) throw error;

      // Transform conversations to Chat interface
      const transformedChats: Chat[] = data.map((conv: ConversationWithMessages) => {
        const lastMessage = conv.messages[conv.messages.length - 1];
        return {
          id: conv.id,
          friendId: conv.other_participant.id,
          friendName: conv.other_participant.display_name,
          lastMessage: lastMessage?.content || "대화를 시작해보세요",
          lastMessageTime: lastMessage ?
            new Date(lastMessage.created_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : "",
          unreadCount: 0, // TODO: Implement unread count logic
          avatar: conv.other_participant.avatar_url || ""
        };
      });

      setChats(transformedChats);
    } catch (error) {
      console.error('Load conversations error:', error);
      toast({
        title: "대화 목록 로드 실패",
        description: "대화 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();

    try {
      const { error } = await messagesService.deleteConversation(chatId);

      if (error) throw error;

      setChats(chats.filter(chat => chat.id !== chatId));
      toast({
        title: "대화방 삭제",
        description: "대화방이 삭제되었습니다."
      });
    } catch (error) {
      console.error('Delete conversation error:', error);
      toast({
        title: "삭제 실패",
        description: "대화방 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">대화</h1>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">대화 목록을 불러오는 중...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">아직 대화가 없습니다</p>
            <p className="text-sm text-muted-foreground mt-2">
              친구 목록에서 대화를 시작해보세요
            </p>
          </div>
        ) : (
          chats.map((chat) => (
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
        ))
        )}
      </div>
    </div>
  );
};

export default ChatsList;