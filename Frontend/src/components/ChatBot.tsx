import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Send, 
  X, 
  Bot, 
  User, 
  Sparkles,
  HelpCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ChatBot({ theme, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI research assistant. I can help you understand the analysis, clarify complex concepts, or suggest related research papers. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickQuestions = [
    "Explain this research in simple terms",
    "What are the practical applications?",
    "How reliable are these findings?",
    "What should I read next?",
    "Any concerns about this study?"
  ];

  const simulateBotResponse = (userMessage) => {
    const responses = [
      "Great question! Based on the research analysis, here's what I can tell you...",
      "That's an interesting point. Let me break this down for you...",
      "From what I've analyzed, the key points are...",
      "This relates to several important concepts in space research...",
      "I'd recommend looking into these related studies for more context..."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse} The research shows significant implications for ${userMessage.toLowerCase().includes('mars') ? 'Mars missions' : userMessage.toLowerCase().includes('invest') ? 'commercial applications' : 'space exploration'}. Would you like me to elaborate on any specific aspect?`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate API delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: simulateBotResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
    handleSend();
  };

  return (
    <Card className="h-full bg-black/30 backdrop-blur-sm border-white/10 flex flex-col">
      <CardHeader className="flex-shrink-0 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={`w-8 h-8 bg-gradient-to-r ${theme.primary} rounded-full flex items-center justify-center`}
            >
              <Bot className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-white text-lg">Research Assistant</CardTitle>
              <p className="text-gray-400 text-sm">Ask me anything about the analysis</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={`bg-gradient-to-r ${theme.primary} text-white`}>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? `bg-gradient-to-r ${theme.primary} text-white`
                      : 'bg-white/10 text-gray-300 border border-white/10'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.type === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-white/10 text-white border border-white/20">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`bg-gradient-to-r ${theme.primary} text-white`}>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/10 border border-white/10 rounded-lg p-3">
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-white/10">
            <p className="text-gray-400 text-sm mb-3">Quick questions:</p>
            <div className="space-y-2">
              {quickQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickQuestion(question)}
                  className="w-full p-2 text-left text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-300 hover:text-white transition-all"
                >
                  <HelpCircle className="w-3 h-3 inline mr-2" />
                  {question}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`bg-gradient-to-r ${theme.primary} hover:opacity-90 px-3`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Helpful Resources */}
          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white text-xs p-1 h-auto"
              onClick={() => window.open('https://osdr.nasa.gov', '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              NASA OSDR
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white text-xs p-1 h-auto"
              onClick={() => window.open('https://lsda.jsc.nasa.gov', '_blank')}
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Life Sciences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}