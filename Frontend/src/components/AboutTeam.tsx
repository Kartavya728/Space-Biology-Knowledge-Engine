import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Github, 
  Linkedin, 
  Mail, 
  Globe, 
  Award,
  Target,
  Users,
  Rocket,
  Brain,
  Code,
  Palette,
  Database,
  Star
} from 'lucide-react';

export function AboutTeam({ theme }) {
  const teamMembers = [
    {
    name: 'Kartavya',
    role: 'RAG System and Frontend',
    avatar: '🚀',
    description: 'Develops scalable Retrieval-Augmented Generation (RAG) systems and integrates them into dynamic, user-friendly interfaces.',
    skills: ['RAG', 'React', 'JavaScript', 'LangChain', 'Frontend Architecture'],
    achievements: [
      'Built scalable RAG pipelines with LLM integration',
      'Designed intuitive interfaces for complex data queries',
      'Contributor to open-source AI tooling'
    ],
    social: {
      github: 'kartavya-dev',
      linkedin: 'kartavya-rag',
      email: 'kartavya@astronots.space'
    },
    icon: Brain,
    color: 'from-blue-500 to-cyan-500'
  },
     {
    name: 'Surya Shrivastav',
    role: 'Knowledge Graph Builder',
    avatar: '🛰️',
    description: 'Specializes in building and maintaining semantic knowledge graphs to enhance information discovery and retrieval.',
    skills: ['Knowledge Graphs', 'Neo4j', 'SPARQL', 'Python', 'Graph Databases'],
    achievements: [
      'Built a research-driven knowledge graph from unstructured data',
      'Optimized graph traversal for high-speed querying',
      'Designed ontology for academic domains'
    ],
    social: {
      github: 'surya-kg',
      linkedin: 'surya-shrivastav',
      email: 'surya@astronots.space'
    },
    icon: Rocket,
    color: 'from-red-500 to-orange-500'
  },
  {
    name: 'Saksham Sethia',
    role: 'Backend',
    avatar: '⚙️',
    description: 'Develops and maintains backend infrastructure including APIs, data pipelines, and service orchestration.',
    skills: ['Node.js', 'Python', 'API Development', 'PostgreSQL', 'Docker'],
    achievements: [
      'Built APIs powering RAG and KG systems',
      'Implemented scalable data ingestion pipelines',
      'Integrated backend with frontend using REST and WebSocket'
    ],
    social: {
      github: 'saksham-backend',
      linkedin: 'saksham-sethia',
      email: 'saksham@astronots.space'
    },
    icon: Database,
    color: 'from-yellow-500 to-amber-500'
  },
      {
    name: 'Yash Sharma',
    role: 'Data Scientist',
    avatar: '📊',
    description: 'Applies statistical and machine learning techniques to extract insights from complex datasets and support model training.',
    skills: ['Data Science', 'Python', 'Pandas', 'Model Evaluation', 'Visualization'],
    achievements: [
      'Processed and analyzed 10,000+ scientific documents',
      'Built evaluation pipeline for LLM-based tools',
      'Generated key insights for user behavior and system accuracy'
    ],
    social: {
      github: 'yash-ds',
      linkedin: 'yash-sharma',
      email: 'yash@astronots.space'
    },
    icon: Database,
    color: 'from-green-500 to-emerald-500'
  },
   {
    name: 'Sapphire',
    role: 'Knowledge Graph',
    avatar: '🧠',
    description: 'Focuses on data modeling and semantic structuring to enable contextual understanding of research data.',
    skills: ['Ontology Design', 'GraphQL', 'Data Modeling', 'Python', 'Linked Data'],
    achievements: [
      'Enhanced graph accuracy with advanced entity linking',
      'Designed modular schemas for evolving scientific domains',
      'Integrated external data sources into the KG pipeline'
    ],
    social: {
      github: 'sapphire-kg',
      linkedin: 'sapphire-graph',
      email: 'sapphire@astronots.space'
    },
    icon: Brain,
    color: 'from-indigo-500 to-blue-500'
  },
   {
    name: 'Sanvi',
    role: 'UI/UX Designer',
    avatar: '🎨',
    description: 'Creates engaging, user-centric interfaces that simplify access to complex scientific knowledge.',
    skills: ['UI/UX Design', 'Figma', 'Prototyping', 'Design Systems', 'Accessibility'],
    achievements: [
      'Designed interfaces for LLM-powered search tools',
      'Conducted usability tests with domain experts',
      'Implemented design systems for consistency and scalability'
    ],
    social: {
      github: 'sanvi-uiux',
      linkedin: 'sanvi-designer',
      email: 'sanvi@astronots.space'
    },
    icon: Palette,
    color: 'from-purple-500 to-pink-500'
  },
  ];

  const projectStats = [
    { label: 'Research Papers Analyzed', value: '608+', icon: Award },
    { label: 'Active Users', value: '2', icon: Users },
    { label: 'AI Models Trained', value: '3', icon: Brain },
    { label: 'Insights Generated', value: '20+', icon: Target }
  ];

  const challenges = [
    {
      title: 'NASA Space Apps Challenge 2024',
      description: 'Our current mission: Creating tools that mine the text of NASA publications',
      status: 'In Progress',
      objective: 'Help scientists, managers, and mission architects explore research more effectively'
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
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={`w-16 h-16 bg-gradient-to-r ${theme.primary} rounded-full flex items-center justify-center`}
            >
              <Rocket className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-white">Meet the AstroNots</h1>
              <p className="text-purple-300">Exploring the cosmos through AI and innovation</p>
            </div>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We're a passionate team of engineers, scientists, and designers united by our mission 
            to make space research more accessible and actionable for everyone.
          </p>
        </motion.div>

        {/* Project Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {projectStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + (index * 0.1) }}
                      className="text-center"
                    >
                      <div className={`w-16 h-16 bg-gradient-to-r ${theme.primary} rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-gray-300 text-sm">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <Star className="w-6 h-6" />
                Our Current Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              {challenges.map((challenge, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{challenge.title}</h3>
                      <p className="text-gray-300 mb-4">{challenge.description}</p>
                      <p className="text-gray-300">{challenge.objective}</p>
                    </div>
                    <Badge className={`ml-4 bg-gradient-to-r ${theme.primary}`}>
                      {challenge.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-8"
        >
          <h2 className="text-3xl font-bold text-white text-center">Our Team</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => {
              const Icon = member.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + (index * 0.1) }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-4xl">{member.avatar}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{member.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-300">{member.role}</p>
                          </div>
                        </div>
                        <div className={`w-12 h-12 bg-gradient-to-r ${member.color} rounded-full flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      <p className="text-gray-300 mb-4">{member.description}</p>

                      {/* Skills */}
                      <div className="mb-4">
                        <h4 className="text-white font-medium mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {member.skills.map((skill, i) => (
                            <Badge key={i} className="bg-white/10 text-white border-white/20 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Achievements */}
                      <div className="mb-4">
                        <h4 className="text-white font-medium mb-2">Key Achievements</h4>
                        <ul className="space-y-1">
                          {member.achievements.map((achievement, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <Star className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Social Links */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10 p-2"
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10 p-2"
                        >
                          <Linkedin className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10 p-2"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
              <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
                At AstroNots, we believe that groundbreaking space research should be accessible to everyone. 
                Our AI-powered platform bridges the gap between complex scientific data and actionable insights, 
                empowering scientists to generate new hypotheses, helping managers identify investment opportunities, 
                and enabling mission architects to plan safer, more efficient space exploration missions.
              </p>
              <div className="mt-6">
                <Badge className={`bg-gradient-to-r ${theme.primary} text-lg px-6 py-2`}>
                  Making Space Science Accessible
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">Get In Touch</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">
                Interested in collaborating or have questions about our project? We'd love to hear from you!
              </p>
              <div className="flex justify-center gap-4">
                <Button className={`bg-gradient-to-r ${theme.primary} hover:opacity-90`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
                <Button variant="outline" className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10">
                  <Globe className="w-4 h-4 mr-2" />
                  Our Website
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}