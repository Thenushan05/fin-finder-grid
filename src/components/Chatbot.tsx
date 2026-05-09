
import { useState, useRef, useEffect } from "react";

import { MessageCircle, X, Send, Map, TrendingUp, Fish, Wrench, ChevronRight, Sparkles, Bot, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { processUserMessage, type ChatMessage } from "@/services/chatService";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Ahoy! I'm Fin, your AI fishing co-pilot. I can help you find hotspots, check market prices, or identify fish. What's on your mind?",
      timestamp: new Date(),
      suggestions: ["Best hotspots today?", "Market price for YFT?", "Identify a fish"],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Get bot response
    try {
      const response = await processUserMessage(text);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleLinkClick = (path: string) => {
    navigate(path);
    // Optional: close chat or keep open
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // For now simply append to input to show it worked
      setInputValue((prev) => (prev ? `${prev} [Attached: ${file.name}]` : `[Attached: ${file.name}]`));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      
      {/* CHAT WINDOW */}
      <div 
        className={cn(
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-[350px] sm:w-[380px] mb-4 overflow-hidden transition-all duration-300 origin-bottom-right pointer-events-auto",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none h-0 mb-0"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Bot className="h-5 w-5 text-white" />
             </div>
             <div>
                <h3 className="font-bold text-white text-sm">Fin Assistant</h3>
                <div className="flex items-center gap-1.5">
                   <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                   <span className="text-[10px] text-indigo-100 font-medium">Online</span>
                </div>
             </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-full h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="h-[400px] overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 space-y-4 scroll-smooth custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2",
                msg.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm relative shadow-sm",
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-sm"
                )}
              >
                 {msg.text.split("**").map((part, i) => 
                     i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                 )}

                 {/* Related Link Action */}
                 {msg.relatedLink && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleLinkClick(msg.relatedLink!)}
                      className="mt-3 w-full border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 h-8 text-xs font-bold"
                    >
                       View Details <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                 )}
              </div>
            </div>
          ))}

          {isTyping && (
             <div className="flex justify-start animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700 shadow-sm flex gap-1 items-center">
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                </div>
             </div>
          )}

           {/* Suggestions (only show for last bot message) */}
           {messages[messages.length - 1].sender === 'bot' && !isTyping && messages[messages.length - 1].suggestions && (
              <div className="flex flex-wrap gap-2 mt-2">
                 {messages[messages.length - 1].suggestions?.map(s => (
                    <button 
                       key={s}
                       onClick={() => handleSuggestionClick(s)}
                       className="text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shadow-sm font-medium flex items-center gap-1.5"
                    >
                       <Sparkles className="h-3 w-3" /> {s}
                    </button>
                 ))}
              </div>
           )}
           <div ref={scrollRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
           <form 
             onSubmit={(e) => { e.preventDefault(); handleSend(); }}
             className="flex gap-2 items-center"
           >
              {/* File Upload Input */}
              <input
                 type="file"
                 ref={fileInputRef}
                 className="hidden"
                 onChange={handleFileSelect}
              />
              <Button
                 type="button"
                 variant="ghost"
                 size="icon"
                 className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                 onClick={() => fileInputRef.current?.click()}
              >
                 <Paperclip className="h-5 w-5" />
              </Button>

              <div className="relative flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about fish, weather..."
                  className="pr-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-xl"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-1 top-1 h-8 w-8 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  disabled={!inputValue.trim() || isTyping}
                >
                   <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
           </form>
        </div>
      </div>

      {/* TOGGLE BUTTON */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 pointer-events-auto border-4 border-white dark:border-slate-900 relative group",
          isOpen ? "bg-slate-800 hover:bg-slate-900 rotate-90" : "bg-gradient-to-br from-indigo-500 to-violet-600 hover:scale-110"
        )}
      >
        {isOpen ? (
           <X className="h-6 w-6 text-white" />
        ) : (
           <>
             <MessageCircle className="h-7 w-7 text-white fill-white/20" />
             <span className="absolute -top-1 -right-1 flex h-4 w-4">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-900"></span>
             </span>
           </>
        )}
      </Button>

    </div>
  );
}
