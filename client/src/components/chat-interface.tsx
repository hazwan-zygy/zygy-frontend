// File: client/src/components/chat-interface.tsx
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: { 
    doc_id: number; 
    page_num: number; 
    score: number; 
    keyword?: string;
  }[];
}

interface ChatInterfaceProps {
  selectedDocument?: { id: number; originalName: string } | null;
  onSourceClick?: (page: number, keyword?: string) => void;
}

export function ChatInterface({ selectedDocument, onSourceClick }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async ({ documentId, message }: { documentId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/documents/${documentId}/chat`, { query: message });
      return response.json();
    },
    onSuccess: (data) => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'bot',
        timestamp: new Date(),
        sources: data.sources,
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error?.message || "An unknown error occurred.",
        variant: "destructive",
      });
       const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please ensure the embedding service is running and try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);
  
  useEffect(() => { setMessages([]); }, [selectedDocument]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedDocument) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    // setMessages(prev => [...prev, userMessage]);
    // chatMutation.mutate({ documentId: selectedDocument.id, message: inputMessage });
    // setInputMessage("");

    // Create an ID for the bot's response message
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: ChatMessage = {
      id: botMessageId,
      content: "", // Start with empty content
      sender: 'bot',
      timestamp: new Date(),
      sources: [], // Start with empty sources
    };

    // Add both messages to the UI immediately
    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputMessage("");
    setIsStreaming(true);

    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}/chat-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputMessage }),
      });

      if (!response.body) {
        throw new Error("Response has no body");
      }
      
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Process each Server-Sent Event chunk
        const eventChunks = value.split('\n\n').filter(Boolean);
        for (const chunk of eventChunks) {
          if (chunk.startsWith('data:')) {
            const data = JSON.parse(chunk.substring(5));
            
            setMessages(prev => prev.map(msg => {
              if (msg.id === botMessageId) {
                // First event will have sources
                const newSources = data.sources || msg.sources;
                // Subsequent events will have content
                const newContent = msg.content + (data.content || "");
                return { ...msg, content: newContent, sources: newSources };
              }
              return msg;
            }));
          }
        }
      }
    } catch (error) {
      console.error("Streaming failed:", error);
      toast({
        title: "Streaming Error",
        description: "Could not get a response from the server.",
        variant: "destructive",
      });
       setMessages(prev => prev.map(msg => 
        msg.id === botMessageId ? { ...msg, content: "Sorry, an error occurred." } : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="h-full flex flex-col bg-slate-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot size={20} className="text-blue-600" />
          Chat Assistant
        </CardTitle>
        {selectedDocument && (
          <Badge variant="secondary" className="text-xs w-fit">
            Discussing: {selectedDocument.originalName}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {selectedDocument 
                    ? "Ask a question about your PDF document."
                    : "Select a PDF document to begin chatting."
                  }
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.sender === 'bot' && (
                    <Avatar className="w-8 h-8 mt-1 shrink-0"><AvatarFallback className="bg-blue-100 text-blue-600"><Bot size={14} /></AvatarFallback></Avatar>
                  )}
                  <div className="flex flex-col items-start max-w-[85%]">
                    <div className={`rounded-lg px-3 py-2 ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className={`text-xs mt-1 block ${message.sender === 'user' ? 'text-blue-100 text-right' : 'text-gray-500'}`}>{formatTime(message.timestamp)}</span>
                    </div>
                      {message.sender === 'bot' && message.sources && message.sources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, index) => (
                              <Button 
                                key={index}
                                variant="outline" 
                                size="sm" 
                                className="h-auto px-2 py-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" 
                                onClick={() => {
                                  if (onSourceClick) {
                                    onSourceClick(source.page_num, source.keyword || "");
                                  }
                                }}
                              >
                                <BookOpen size={12} className="mr-1.5" />
                                Page {source.page_num} 
                                <span className="ml-1.5 text-gray-400">({(source.score * 100).toFixed(0)}%)</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="w-8 h-8 mt-1 shrink-0"><AvatarFallback className="bg-gray-100 text-gray-600"><User size={14} /></AvatarFallback></Avatar>
                  )}
                </div>
              ))
            )}
            
            {isStreaming && messages[messages.length - 1]?.sender === 'bot' && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8 mt-1"><AvatarFallback className="bg-blue-100 text-blue-600"><Bot size={14} /></AvatarFallback></Avatar>
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="flex gap-2">
          <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder={selectedDocument ? "Ask a question..." : "Select a document..."} disabled={!selectedDocument || chatMutation.isPending} className="flex-1" />
          <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || !selectedDocument || chatMutation.isPending} size="icon" className="shrink-0">
            {chatMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}