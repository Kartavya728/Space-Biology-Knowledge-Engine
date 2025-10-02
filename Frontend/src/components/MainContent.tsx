import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Spline from '@splinetool/react-spline/next';
import { 
  Send, 
  Upload, 
  Mic, 
  Image, 
  FileText,
  Brain,
  TrendingUp,
  Map,
  Sparkles,
  Loader2,
  ChevronDown,
  Zap,
  CheckCircle,
  Terminal,
  Database,
  Search
} from 'lucide-react';
import { AIAgent3D } from './AIAgent3D';
import { ResponseDisplay } from './ResponseDisplay';
import { api } from '../utils/api';

interface ThinkingStep {
  step: string;
  message: string;
  details?: any;
  preview?: string;
  output?: string;
  timestamp: number;
}

export function MainContent({ userType, theme }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [overallTitle, setOverallTitle] = useState('');
  const [thinkingHistory, setThinkingHistory] = useState<ThinkingStep[]>([]);
  const [showTransition, setShowTransition] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [streamingStepIndex, setStreamingStepIndex] = useState<number | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [streamSpeed, setStreamSpeed] = useState(5);
  const [isQuerySubmitted, setIsQuerySubmitted] = useState(false);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    if (streamingStepIndex === null || !isLoading) return;

    const step = thinkingHistory[streamingStepIndex];
    if (!step) return;

    const contentToStream = step.preview || step.output || (step.details ? JSON.stringify(step.details, null, 2) : '');
    
    if (!contentToStream || streamedText.length >= contentToStream.length) {
      setTimeout(() => {
        setExpandedSteps(new Set());
        setStreamedText('');
        
        let nextIndex = streamingStepIndex + 1;
        while (nextIndex < thinkingHistory.length) {
          const nextStep = thinkingHistory[nextIndex];
          if (nextStep.preview || nextStep.output || nextStep.details) {
            setStreamingStepIndex(nextIndex);
            setExpandedSteps(new Set([nextIndex]));
            return;
          }
          nextIndex++;
        }
        
        setStreamingStepIndex(null);
      }, 300);
      return;
    }

    const timer = setTimeout(() => {
      const nextLength = Math.min(streamedText.length + streamSpeed, contentToStream.length);
      setStreamedText(contentToStream.slice(0, nextLength));
    }, 50);

    return () => clearTimeout(timer);
  }, [streamedText, streamingStepIndex, thinkingHistory, streamSpeed, isLoading]);

  useEffect(() => {
    if (thinkingHistory.length > 0 && streamingStepIndex === null && isLoading) {
      const firstContentIndex = thinkingHistory.findIndex(
        step => step.preview || step.output || step.details
      );
      if (firstContentIndex !== -1) {
        setStreamingStepIndex(firstContentIndex);
        setExpandedSteps(new Set([firstContentIndex]));
      }
    }
  }, [thinkingHistory, streamingStepIndex, isLoading]);

  const handleSubmit = async (customPrompt = null) => {
    const finalQuery = customPrompt || query;
    if (!finalQuery.trim()) {
      alert('Please enter a query or upload a file');
      return;
    }

    setIsLoading(true);
    setIsQuerySubmitted(true);
    setResponse(null);
    setOverallTitle('');
    setThinkingHistory([]);
    setExpandedSteps(new Set());
    setShowTransition(false);
    setStreamingStepIndex(null);
    setStreamedText('');

    const collectedParagraphs = [];
    let collectedMetadata = null;

    try {
      await api.streamAnalysis(
        {
          query: finalQuery,
          userType,
        },
        (event) => {
          if (event.type === 'thinking_step') {
            const newStep: ThinkingStep = {
              ...event.content,
              timestamp: Date.now()
            };
            
            setThinkingHistory(prev => [...prev, newStep]);
          } 
          else if (event.type === 'title') {
            setOverallTitle(event.content);
          } 
          else if (event.type === 'paragraph') {
            collectedParagraphs.push(event.content);
            setResponse({
              paragraphs: [...collectedParagraphs],
              metadata: collectedMetadata,
              userType,
              overallTitle
            });
          } 
          else if (event.type === 'metadata') {
            collectedMetadata = event.content;
            setResponse({
              paragraphs: collectedParagraphs,
              metadata: event.content,
              userType,
              overallTitle
            });
          } 
          else if (event.type === 'error') {
            console.error('Analysis error:', event.content);
            alert(`Error: ${event.content}`);
          } 
          else if (event.type === 'done') {
            setShowTransition(true);
            setTimeout(() => {
              setIsLoading(false);
              setIsQuerySubmitted(false);
            }, 1000);
          }
        }
      );
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze content. Please try again.');
      setIsLoading(false);
      setIsQuerySubmitted(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setQuery(`Analyze the uploaded file: ${file.name}`);
      alert(`File "${file.name}" uploaded successfully`);
    }
  };

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (step: string) => {
    if (step.includes('retrieval') || step.includes('document')) return Database;
    if (step.includes('search') || step.includes('tool')) return Search;
    if (step.includes('agent')) return Brain;
    return Terminal;
  };

  const currentAnalyst = analystOptions[userType];
  const AnalystIcon = currentAnalyst.icon;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <motion.div 
        className="p-6 border-b border-white/10"
        animate={{
          y: isQuerySubmitted ? -100 : 0,
          opacity: isQuerySubmitted ? 0 : 1,
          height: isQuerySubmitted ? 0 : 'auto'
        }}
        transition={{ duration: 0.5 }}
      >
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
      </motion.div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              
              <AnimatePresence>
                {isQuerySubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-white font-medium text-lg">{query}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isQuerySubmitted && (
                <div className="flex justify-center mb-6">
                  <AIAgent3D userType={userType} isThinking={false} />
                </div>
              )}

              <AnimatePresence>
                {isLoading && thinkingHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.95, 
                      y: -20,
                      transition: { duration: 0.5 }
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-blue-400/30 shadow-xl">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Brain className="w-5 h-5 text-blue-400" />
                          </motion.div>
                          Agent Reasoning Process
                          <motion.div
                            className="ml-auto flex gap-1"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            <div className="w-2 h-2 bg-purple-400 rounded-full" />
                            <div className="w-2 h-2 bg-pink-400 rounded-full" />
                          </motion.div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 max-h-[600px] overflow-y-auto space-y-2">
                        {thinkingHistory.map((step, idx) => {
                          const StepIcon = getStepIcon(step.step);
                          const isExpanded = expandedSteps.has(idx);
                          const isStreaming = idx === streamingStepIndex;
                          const hasContent = step.preview || step.output || step.details;
                          
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
                            >
                              <button
                                onClick={() => !isStreaming && hasContent && toggleStep(idx)}
                                disabled={isStreaming}
                                className={`w-full p-3 flex items-center gap-3 text-left transition-colors ${
                                  !isStreaming && hasContent ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'
                                }`}
                              >
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <ChevronDown className={`w-4 h-4 flex-shrink-0 ${
                                    hasContent ? 'text-blue-400' : 'text-gray-600'
                                  }`} />
                                </motion.div>
                                
                                <StepIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                
                                <span className="text-gray-300 flex-1 text-sm">
                                  {step.message}
                                </span>
                                
                                {isStreaming && (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
                                )}
                              </button>
                              
                              <AnimatePresence>
                                {isExpanded && hasContent && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-3 pt-0 space-y-3">
                                      {isStreaming ? (
                                        <div className="bg-white/5 rounded-lg p-3">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Terminal className="w-3 h-3 text-green-400" />
                                            <span className="text-xs text-gray-400 font-semibold">
                                              {step.preview ? 'Content Preview' : step.output ? 'Retrieved Output' : 'Details'}
                                            </span>
                                          </div>
                                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                            {streamedText}
                                            <motion.span
                                              animate={{ opacity: [1, 0] }}
                                              transition={{ duration: 0.5, repeat: Infinity }}
                                              className="inline-block w-1 h-3 bg-blue-400 ml-1"
                                            />
                                          </pre>
                                        </div>
                                      ) : (
                                        <>
                                          {step.details && (
                                            <div className="bg-white/5 rounded-lg p-3">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Terminal className="w-3 h-3 text-green-400" />
                                                <span className="text-xs text-gray-400 font-semibold">Details</span>
                                              </div>
                                              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                                {JSON.stringify(step.details, null, 2)}
                                              </pre>
                                            </div>
                                          )}
                                          
                                          {step.preview && (
                                            <div className="bg-white/5 rounded-lg p-3">
                                              <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-3 h-3 text-blue-400" />
                                                <span className="text-xs text-gray-400 font-semibold">Content Preview</span>
                                              </div>
                                              <div className="text-sm text-gray-300 max-h-48 overflow-y-auto">
                                                <p className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                                  {step.preview}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {step.output && (
                                            <div className="bg-white/5 rounded-lg p-3">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Database className="w-3 h-3 text-yellow-400" />
                                                <span className="text-xs text-gray-400 font-semibold">Retrieved Output</span>
                                              </div>
                                              <div className="text-sm text-gray-300 max-h-64 overflow-y-auto">
                                                <p className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                                  {step.output}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showTransition && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.8 }}
                    className="flex justify-center"
                  >
                    <motion.div
                      className={`p-6 bg-gradient-to-r ${theme.primary} rounded-full`}
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ duration: 1 }}
                    >
                      <CheckCircle className="w-12 h-12 text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!response && !isQuerySubmitted && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                >
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

                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 mt-6">
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
                              <Image className="w-4 h-4 mr-2" />
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
                </motion.div>
              )}

              <AnimatePresence>
                {response && response.paragraphs && response.paragraphs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <ResponseDisplay response={response} theme={theme} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

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