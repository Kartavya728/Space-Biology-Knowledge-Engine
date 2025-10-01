import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Upload, 
  Brain, 
  BarChart3, 
  MessageCircle, 
  Users, 
  Database,
  Zap,
  Target,
  Search,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function HowItWorks({ theme }) {
  const steps = [
    {
      id: 1,
      title: 'Input Your Content',
      description: 'Upload research papers, images, or provide text/audio input about any NASA research topic',
      icon: Upload,
      details: [
        'Support for multiple file formats (PDF, DOC, images)',
        'Text input for research questions',
        'Audio input for spoken queries',
        'Direct NASA database integration'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'AI Analysis Engine',
      description: 'Our advanced AI processes your content using specialized models trained on NASA research',
      icon: Brain,
      details: [
        'Natural language processing for research papers',
        'Computer vision for scientific imagery',
        'Speech recognition for audio queries',
        'Context-aware understanding'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 3,
      title: 'Custom Analyst Selection',
      description: 'Choose your perspective: Scientist, Manager/Investor, or Mission Architect',
      icon: Users,
      details: [
        'Scientist: Focus on methodology and hypothesis generation',
        'Manager/Investor: Commercial applications and opportunities',
        'Mission Architect: Safety, efficiency, and feasibility',
        'Tailored explanations for each perspective'
      ],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 4,
      title: 'Intelligent Processing',
      description: 'Advanced algorithms analyze patterns, extract insights, and generate comprehensive responses',
      icon: Zap,
      details: [
        'Multi-modal data fusion',
        'Statistical analysis and validation',
        'Cross-reference with NASA databases',
        'Real-time processing capabilities'
      ],
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 5,
      title: 'Rich Response Generation',
      description: 'Get detailed analysis with text, visualizations, tables, and actionable insights',
      icon: BarChart3,
      details: [
        'Comprehensive text analysis',
        'Interactive charts and graphs',
        'Data tables with key metrics',
        'Visual representations of findings'
      ],
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 6,
      title: 'Interactive Chat & Resources',
      description: 'Ask follow-up questions and access relevant NASA resources for deeper understanding',
      icon: MessageCircle,
      details: [
        'Real-time chat with AI assistant',
        'Access to NASA Open Science Data Repository',
        'Links to related research papers',
        'Contextual resource recommendations'
      ],
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const features = [
    {
      title: 'Multi-Modal Input',
      description: 'Process text, images, audio, and documents',
      icon: FileText
    },
    {
      title: 'NASA Database Integration',
      description: 'Direct access to official NASA research repositories',
      icon: Database
    },
    {
      title: 'Real-Time Analysis',
      description: 'Instant processing and response generation',
      icon: Zap
    },
    {
      title: 'Specialized Perspectives',
      description: 'Tailored analysis for different professional needs',
      icon: Target
    },
    {
      title: 'Interactive Exploration',
      description: 'Chat-based interface for deeper understanding',
      icon: Search
    },
    {
      title: 'Rich Visualizations',
      description: 'Charts, graphs, and data tables for clarity',
      icon: BarChart3
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold text-white mb-4">How AstroNots Works</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our AI-powered platform transforms complex NASA research into actionable insights 
            tailored for scientists, investors, and mission architects
          </p>
        </motion.div>

        {/* Process Flow */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
                  <CardContent className="p-8">
                    <div className={`grid md:grid-cols-2 gap-8 items-center ${
                      index % 2 === 1 ? 'md:grid-flow-col-dense' : ''
                    }`}>
                      {/* Content */}
                      <div className={index % 2 === 1 ? 'md:col-start-2' : ''}>
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <Badge className="mb-2 bg-white/10 text-white border-white/20">
                              Step {step.id}
                            </Badge>
                            <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-lg mb-6">{step.description}</p>
                        
                        <ul className="space-y-3">
                          {step.details.map((detail, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index * 0.1) + (i * 0.05) }}
                              className="flex items-center gap-3 text-gray-300"
                            >
                              <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />
                              {detail}
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Visual */}
                      <div className={`${index % 2 === 1 ? 'md:col-start-1' : ''} flex justify-center`}>
                        <motion.div
                          animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ 
                            duration: 4,
                            repeat: Infinity,
                            delay: index * 0.5
                          }}
                          className={`w-64 h-64 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center opacity-20 border border-white/10`}
                        >
                          <Icon className="w-24 h-24 text-white" />
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (index + 1) * 0.1 }}
                    className="flex justify-center my-8"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${theme.primary} rounded-full flex items-center justify-center`}>
                      <ArrowRight className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + (index * 0.1) }}
                      whileHover={{ scale: 1.05 }}
                      className="p-6 bg-white/5 rounded-lg border border-white/10 text-center hover:bg-white/10 transition-all"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-r ${theme.primary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                      <p className="text-gray-300 text-sm">{feature.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* NASA Resources Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">
                Powered by NASA Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 text-center">
                  <Database className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h4 className="text-white font-semibold mb-2">NASA OSDR</h4>
                  <p className="text-gray-300 text-sm">Open Science Data Repository with primary research data</p>
                </div>
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 text-center">
                  <FileText className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <h4 className="text-white font-semibold mb-2">Life Sciences Library</h4>
                  <p className="text-gray-300 text-sm">Comprehensive collection of space life sciences publications</p>
                </div>
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 text-center">
                  <Search className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <h4 className="text-white font-semibold mb-2">NASA Task Book</h4>
                  <p className="text-gray-300 text-sm">Grant information and funding details for research studies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}