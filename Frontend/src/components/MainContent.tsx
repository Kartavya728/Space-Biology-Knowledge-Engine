import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Send, 
  Upload, 
  Mic, 
  Image as ImageIcon, 
  FileText, 
  Brain,
  TrendingUp,
  Map,
  Sparkles,
  Loader2,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { AIAgent3D } from './AIAgent3D';
import { LoadingAnimation } from './LoadingAnimation';
import { ResponseDisplay } from './ResponseDisplay';
import { ChatBot } from './ChatBot';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/api';

export function MainContent({ userType, theme }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const analystOptions = {
    scientist: {
      title: 'Scientific Analysis',
      description: 'Generate new hypotheses and analyze research methodologies',
      icon: Brain,
      color: 'blue',
      prompts: [
        'Analyze the methodology in this research paper',
        'What new hypotheses can be generated from these findings?',
        'Explain the statistical significance of these results',
        'How does this research contribute to the field?'
      ]
    },
    investor: {
      title: 'Investment Analysis',
      description: 'Identify commercial opportunities and market potential',
      icon: TrendingUp,
      color: 'green',
      prompts: [
        'What are the commercial applications of this research?',
        'Analyze the market potential and investment opportunities',
        'What are the economic implications of these findings?',
        'Identify potential licensing and partnership opportunities'
      ]
    },
    'mission-architect': {
      title: 'Mission Planning',
      description: 'Evaluate safety, efficiency, and feasibility for space missions',
      icon: Map,
      color: 'red',
      prompts: [
        'How can this research improve mission safety?',
        'What are the engineering challenges and solutions?',
        'Analyze the feasibility for Moon/Mars missions',
        'What mission parameters need consideration?'
      ]
    }
  };

  const handleSubmit = async (customPrompt = null) => {
    const finalQuery = customPrompt || query;
    if (!finalQuery.trim()) {
      toast.error('Please enter a query or upload a file');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      // Get the appropriate analysis function based on user type
      const analysisFunction = api.getAnalysisFunction(userType);
      
      // Call the API with the query
      const data = await analysisFunction({
        query: finalQuery,
        userType,
        analyst: selectedAnalyst
      });
      
      setResponse(data);
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle file upload logic
      setQuery(`Analyze the uploaded file: ${file.name}`);
      toast.success(`File "${file.name}" uploaded successfully`);
    }
  };

  const currentAnalyst = analystOptions[userType];
  const AnalystIcon = currentAnalyst.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              NASA Research AI Agent
            </h1>
            <p className="text-gray-300">
              Analyze research papers, generate insights, and explore space science
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`p-4 bg-gradient-to-r ${theme.primary} rounded-xl`}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* AI Agent 3D Component */}
              <div className="flex justify-center mb-6">
                <AIAgent3D userType={userType} isThinking={isLoading} />
              </div>

              {/* Analyst Selection */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AnalystIcon className="w-5 h-5" />
                    Custom Analyst: {currentAnalyst.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{currentAnalyst.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {currentAnalyst.prompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSubmit(prompt)}
                        className="p-3 text-left bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-300 hover:text-white transition-all text-sm"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Input Section */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask me anything about NASA research, space science, or upload a research paper..."
                      className="min-h-32 bg-white/5 border-white/20 text-white placeholder:text-gray-400 resize-none"
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Image
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          Audio
                        </Button>
                      </div>
                      
                      <Button
                        onClick={() => handleSubmit()}
                        disabled={isLoading}
                        className={`bg-gradient-to-r ${theme.primary} hover:opacity-90 px-6`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {isLoading ? 'Analyzing...' : 'Analyze'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading Animation */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <LoadingAnimation userType={userType} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Response Display */}
              <AnimatePresence>
                {response && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ResponseDisplay response={response} theme={theme} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reference Links */}
              {response && (
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Reference Papers & Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <a href="https://osdr.nasa.gov" target="_blank" rel="noopener noreferrer" 
                         className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-300 hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                        <div>
                          <p className="font-medium">NASA Open Science Data Repository</p>
                          <p className="text-sm text-gray-400">Primary data and metadata from studies</p>
                        </div>
                      </a>
                      <a href="https://lsda.jsc.nasa.gov" target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-300 hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                        <div>
                          <p className="font-medium">NASA Space Life Sciences Library</p>
                          <p className="text-sm text-gray-400">Additional relevant publications</p>
                        </div>
                      </a>
                      <a href="https://taskbook.nasaprs.com" target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-300 hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                        <div>
                          <p className="font-medium">NASA Task Book</p>
                          <p className="text-sm text-gray-400">Grant information for studies</p>
                        </div>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Chat Bot Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowChat(!showChat)}
          className={`fixed bottom-6 right-6 p-4 bg-gradient-to-r ${theme.primary} rounded-full shadow-lg z-20`}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </motion.button>

        {/* Chat Bot Overlay */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              className="fixed right-0 top-0 h-full w-96 z-30"
            >
              <ChatBot theme={theme} onClose={() => setShowChat(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.jpg,.png"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}