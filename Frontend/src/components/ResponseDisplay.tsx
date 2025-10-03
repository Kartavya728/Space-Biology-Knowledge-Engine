import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { 
  FileText, 
  Image, 
  Brain,
  AlertCircle,
  TrendingUp,
  Map,
  Send,
  Loader2,
  Bot,
  User
} from 'lucide-react';

interface Paragraph {
  title: string;
  text: string;
  images: string[];
  tables: string[];
}

interface ResponseData {
  paragraphs: Paragraph[];
  overallTitle?: string;
  metadata: {
    total_paragraphs: number;
    total_images: string[];
    total_tables: string[];
    source_documents: number;
    user_type: string;
  };
  userType: string;
}

interface ResponseDisplayProps {
  response: ResponseData;
  theme: any;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function AnimatedSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

export function ResponseDisplay({ response, theme }: ResponseDisplayProps) {
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [tableContents, setTableContents] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadImageMap = async () => {
      try {
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error(`Failed to load images.json: ${response.status}`);
        const data = await response.json();
        setImageMap(data);
      } catch (error) {
        console.error('Error loading images.json:', error);
      } finally {
        setLoadingImages(false);
      }
    };
    loadImageMap();
  }, []);

  useEffect(() => {
    const loadTables = async () => {
      if (!response?.metadata?.total_tables || response.metadata.total_tables.length === 0) {
        setLoadingTables(false);
        return;
      }

      const tableData: Record<string, string> = {};
      for (const tableId of response.metadata.total_tables) {
        try {
          const tableResponse = await fetch(`/tables_data/${tableId}.html`);
          if (tableResponse.ok) {
            const html = await tableResponse.text();
            tableData[tableId] = html;
          }
        } catch (error) {
          console.error(`Error loading table ${tableId}:`, error);
        }
      }
      setTableContents(tableData);
      setLoadingTables(false);
    };
    loadTables();
  }, [response?.metadata?.total_tables]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: `Based on the analysis provided, I can help clarify that aspect. The research findings suggest that ${chatInput.toLowerCase()} is an important consideration in this context. Would you like me to elaborate on any specific part of the analysis?`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setIsChatLoading(false);
    }, 1500);
  };

  if (!response || !response.paragraphs || response.paragraphs.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">No response data available</p>
        </CardContent>
      </Card>
    );
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'scientist': return <Brain className="w-5 h-5" />;
      case 'investor': return <TrendingUp className="w-5 h-5" />;
      case 'mission-architect': return <Map className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'scientist': return 'Scientific Analysis';
      case 'investor': return 'Investment Analysis';
      case 'mission-architect': return 'Mission Architecture';
      default: return 'Analysis';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Section */}
      {response.overallTitle && (
        <AnimatedSection>
          <Card className={`bg-gradient-to-r ${theme.primary} backdrop-blur-sm border-white/20`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {getUserTypeIcon(response.userType)}
                <h2 className="text-2xl font-bold text-white flex-1">{response.overallTitle}</h2>
                <Badge className="bg-white/20 text-white">{getUserTypeLabel(response.userType)}</Badge>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}

     

      {/* Paragraphs Section */}
      {response.paragraphs.map((paragraph, index) => (
        <AnimatedSection key={index} delay={index * 0.05}>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden hover:border-white/20 transition-all">
            {paragraph.title && (
              <CardHeader className={`bg-gradient-to-r ${theme.primary} bg-opacity-20`}>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <motion.div 
                    className={`w-1 h-6 bg-gradient-to-b ${theme.primary} rounded-full`}
                    animate={{ scaleY: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {paragraph.title}
                </CardTitle>
              </CardHeader>
            )}
            
            <CardContent className="p-6 space-y-6">
              <motion.div 
                className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {(() => {
                  const t: any = (paragraph as any)?.text;
                  if (typeof t === 'string') return t;
                  if (Array.isArray(t)) {
                    return t.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n\n');
                  }
                  if (t && typeof t === 'object') {
                    if ('text' in t && typeof (t as any).text === 'string') return (t as any).text;
                    return JSON.stringify(t);
                  }
                  return String(t ?? '');
                })()}
              </motion.div>

              {/* Images */}
              {paragraph.images && paragraph.images.length > 0 && (
                <div className="space-y-4">
                  {paragraph.images.map((imageId, imgIndex) => {
                    const imageUrl = imageMap[imageId];
                    return (
                      <motion.div 
                        key={imgIndex} 
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        {loadingImages ? (
                          <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin h-8 w-8 text-white" />
                          </div>
                        ) : imageUrl ? (
                          <div>
                            <motion.img 
                              src={imageUrl} 
                              alt={`Figure ${imageId}`}
                              className="w-full h-auto rounded-lg mb-3 cursor-pointer"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="flex items-center gap-2 text-sm">
                              <Image className="w-4 h-4 text-blue-400" />
                              <p className="text-gray-400 font-mono">{imageId}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p className="text-sm">{imageId}</p>
                            <p className="text-xs text-gray-600">Image mapping not found</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Tables */}
              {paragraph.tables && paragraph.tables.length > 0 && (
                <div className="space-y-4">
                  {paragraph.tables.map((tableId, tblIndex) => {
                    const tableHtml = tableContents[tableId];
                    return (
                      <motion.div 
                        key={tblIndex} 
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-green-400" />
                          <p className="text-sm text-gray-400 font-mono">{tableId}</p>
                        </div>
                        {loadingTables ? (
                          <div className="flex items-center justify-center h-32">
                            <Loader2 className="animate-spin h-8 w-8 text-white" />
                          </div>
                        ) : tableHtml ? (
                          <motion.div 
                            className="overflow-x-auto text-gray-300 table-container"
                            dangerouslySetInnerHTML={{ __html: tableHtml }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p className="text-sm">Table {tableId} not available</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}

      {/* Chat Interface Section */}
      <AnimatedSection delay={0.3}>
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader className={`bg-gradient-to-r ${theme.primary} bg-opacity-20`}>
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Ask Questions About This Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Chat Messages */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ask me anything about the analysis above</p>
                  <p className="text-sm mt-2">I can help clarify findings, explain methodologies, or discuss implications</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className={`p-2 bg-gradient-to-r ${theme.primary} rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0`}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-500/20 text-white' 
                        : 'bg-white/10 text-gray-300'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="p-2 bg-blue-500/20 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              {isChatLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className={`p-2 bg-gradient-to-r ${theme.primary} rounded-full h-8 w-8 flex items-center justify-center`}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                  placeholder="Ask a follow-up question..."
                  className="min-h-[60px] bg-white/5 border-white/20 text-white placeholder:text-gray-400 resize-none flex-1"
                />
                <Button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || isChatLoading}
                  className={`bg-gradient-to-r ${theme.primary} hover:opacity-90 self-end`}
                >
                  {isChatLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  );
}