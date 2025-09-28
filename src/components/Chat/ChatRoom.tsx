import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { messagesService } from "@/services/messages";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
  senderAvatar?: string;
}

interface ChatRoomProps {
  friendName: string;
  friendId?: string;
  conversationId?: string;
  onBack: () => void;
}

const ChatRoom = ({ friendName, friendId, conversationId, onBack }: ChatRoomProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (currentConversationId) {
      loadMessages();
      // Set up real-time subscription
      const subscription = messagesService.subscribeToMessages(currentConversationId, (newMessage) => {
        const transformedMessage: Message = {
          id: newMessage.id,
          text: newMessage.content,
          timestamp: new Date(newMessage.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          isSent: newMessage.sender_id === user?.id,
          senderName: newMessage.sender_id === user?.id ? userProfile?.display_name : friendName
        };

        setMessages(prev => [...prev, transformedMessage]);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else if (friendId) {
      // Create conversation if it doesn't exist
      createConversation();
    }
  }, [currentConversationId, friendId, user?.id, userProfile, friendName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createConversation = async () => {
    if (!friendId) return;

    try {
      const { data, error } = await messagesService.getOrCreateConversation(friendId);
      if (error) throw error;

      setCurrentConversationId(data.id);
    } catch (error) {
      console.error('Create conversation error:', error);
      toast({
        title: "대화방 생성 실패",
        description: "대화방을 생성하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async () => {
    if (!currentConversationId) return;

    try {
      const { data, error } = await messagesService.getMessages(currentConversationId);
      if (error) throw error;

      const transformedMessages: Message[] = data.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        isSent: msg.sender_id === user?.id,
        senderName: msg.sender_id === user?.id ? userProfile?.display_name : friendName,
        senderAvatar: msg.sender?.avatar_url
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Load messages error:', error);
      toast({
        title: "메시지 로드 실패",
        description: "메시지를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversationId || sending) return;

    try {
      setSending(true);
      const { error } = await messagesService.sendMessage(currentConversationId, newMessage.trim());

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: "메시지 전송 실패",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center p-4 bg-nav-background border-b border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <h1 className="text-lg font-semibold">{friendName}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">메시지를 불러오는 중...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end space-x-2 ${message.isSent ? 'justify-end flex-row-reverse space-x-reverse' : 'justify-start'}`}
          >
            {/* Profile Picture */}
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={message.senderAvatar || (message.isSent ? userProfile?.avatar_url : "")} />
              <AvatarFallback className="bg-yellow-light text-foreground text-xs">
                {message.isSent ? (userProfile?.display_name?.charAt(0) || '나') : friendName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col max-w-xs">
              <div
                className={`px-4 py-2 rounded-2xl ${
                  message.isSent 
                    ? 'bg-chat-sent text-primary-foreground rounded-br-sm' 
                    : 'bg-chat-received text-foreground rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              <span className={`text-xs text-muted-foreground mt-1 px-2 ${message.isSent ? 'text-right' : 'text-left'}`}>
                {message.timestamp}
              </span>
            </div>
          </div>
        ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-nav-background border-t border-border">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Smile size={20} />
          </Button>
          
          <Input
            placeholder="메시지를 입력하세요..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;