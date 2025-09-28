import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
}

const mockMessages: Message[] = [
  {
    id: "1",
    text: "안녕하세요! 오늘 어떻게 지내세요?",
    timestamp: "오후 2:10",
    isSent: false
  },
  {
    id: "2", 
    text: "안녕하세요! 잘 지내고 있어요 😊",
    timestamp: "오후 2:12",
    isSent: true
  },
  {
    id: "3",
    text: "다행이네요. 혹시 시간 되실 때 카페에서 만날까요?",
    timestamp: "오후 2:15",
    isSent: false
  },
  {
    id: "4",
    text: "좋아요! 몇 시에 만날까요?",
    timestamp: "오후 2:18",
    isSent: true
  }
];

interface ChatRoomProps {
  friendName: string;
  onBack: () => void;
}

const ChatRoom = ({ friendName, onBack }: ChatRoomProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        isSent: true
      };
      setMessages([...messages, message]);
      setNewMessage("");
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end space-x-2 ${message.isSent ? 'justify-end flex-row-reverse space-x-reverse' : 'justify-start'}`}
          >
            {/* Profile Picture */}
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className="bg-yellow-light text-foreground text-xs">
                {message.isSent ? '나' : friendName.charAt(0)}
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
        ))}
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
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;