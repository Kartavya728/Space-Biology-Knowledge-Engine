import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import Spline from '@splinetool/react-spline';

import {
  Rocket,
  Upload,
  Brain,
  BarChart3,
  Users,
  Database,
  Target,
  Sparkles,
  Github,
  Linkedin,
  Mail,
  Code,
  Palette,
  ChevronUp,
} from "lucide-react";

export  function HomePage() {
  const theme = {
    bgDarkClass: "bg-gradient-to-b from-[#0a0e27] via-[#0f1420] to-[#1a1f3a]",
    textLight: "text-gray-200",
    cardBg: "bg-gradient-to-br from-blue-950/30 to-slate-900/30 backdrop-blur-md border border-blue-500/20",
  };

  const howItWorksSteps = [
    {
      id: 1,
      title: "Seamless Data Ingestion",
      description: "Effortlessly upload diverse research data formats – papers, images, audio – or connect directly to NASA's vast archives.",
      icon: Upload,
      details: [
        "Multi-modal input support (PDF, DOCX, JPG, PNG, MP3, WAV)",
        "Direct integration with NASA Open Science Data Repository",
        "Secure and encrypted data handling",
        "Intelligent pre-processing for various data types",
      ],
      color: "from-blue-400 to-cyan-400",
    },
    {
      id: 2,
      title: "Advanced AI Core Analysis",
      description: "Our proprietary AI engine, trained on millions of NASA documents, performs deep contextual analysis.",
      icon: Brain,
      details: [
        "Specialized Natural Language Processing (NLP) for scientific texts",
        "Computer Vision for interpreting astronomical and geological imagery",
        "Semantic understanding and entity extraction",
        "Cross-referencing across diverse NASA datasets",
      ],
      color: "from-indigo-400 to-blue-400",
    },
    {
      id: 3,
      title: "Perspective-Driven Insights",
      description: "Tailor your analysis by choosing a persona: Scientist, Investor/Manager, or Mission Architect, to receive relevant insights.",
      icon: Users,
      details: [
        "Scientist: Hypotheses, methodologies, data correlations, experimental design suggestions",
        "Investor/Manager: Market potential, commercial applications, risk assessment, funding opportunities",
        "Mission Architect: Feasibility studies, logistical challenges, safety protocols, resource optimization",
        "Customizable output formats for each role",
      ],
      color: "from-cyan-400 to-teal-400",
    },
    {
      id: 4,
      title: "Interactive Q&A & Visualization",
      description: "Engage with the AI through chat, ask follow-up questions, and explore findings via rich, interactive visualizations.",
      icon: BarChart3,
      details: [
        "Real-time conversational AI for iterative exploration",
        "Dynamic charts, graphs, and 3D models of data",
        "Exportable reports and data sets",
        "Contextual links to original NASA source documents",
      ],
      color: "from-sky-400 to-blue-500",
    },
  ];

  const teamMembers = [
    {
      name: "Kartavya",
      role: "RAG System & Frontend Lead",
      avatar: "🚀",
      description: "Architects scalable Retrieval-Augmented Generation systems and crafts intuitive, high-performance user interfaces.",
      skills: ["RAG", "React", "TypeScript", "LangChain", "Frontend Dev"],
      icon: Brain,
    },
    {
      name: "Surya Shrivastav",
      role: "Knowledge Graph Architect",
      avatar: "🛰️",
      description: "Designs and builds sophisticated knowledge graphs, turning unstructured data into semantic, queryable intelligence.",
      skills: ["Knowledge Graphs", "Neo4j", "Python", "Graph DBs", "Ontology"],
      icon: Database,
    },
    {
      name: "Saksham Sethia",
      role: "Backend & Infrastructure",
      avatar: "⚙️",
      description: "Develops robust backend APIs, data pipelines, and manages scalable cloud infrastructure for core services.",
      skills: ["Node.js", "Python", "APIs", "PostgreSQL", "Docker", "AWS"],
      icon: Code,
    },
    {
      name: "Yash Sharma",
      role: "Data Scientist & ML Engineer",
      avatar: "📊",
      description: "Applies advanced statistical and machine learning techniques to extract critical insights and validate AI models.",
      skills: ["Data Science", "ML", "Python", "Pandas", "Model Eval", "Numpy"],
      icon: BarChart3,
    },
    {
      name: "Sapphire",
      role: "Semantic Data Modeler",
      avatar: "🧠",
      description: "Focuses on data modeling and semantic structuring to enable contextual understanding of complex research data.",
      skills: ["Ontology Design", "GraphQL", "Data Modeling", "Linked Data"],
      icon: Sparkles,
    },
    {
      name: "Sanvi",
      role: "UI/UX Designer",
      avatar: "🎨",
      description: "Crafts engaging, user-centric interfaces that simplify access to complex scientific knowledge for diverse users.",
      skills: ["UI/UX Design", "Figma", "Prototyping", "Design Systems"],
      icon: Palette,
    },
  ];

  const projectStats = [
    { label: "NASA Datasets Integrated", value: "8+", icon: Database },
    { label: "AI Models Deployed", value: "5+", icon: Brain },
    { label: "Research Areas Covered", value: "20+", icon: Target },
    { label: "Active Team Members", value: "6", icon: Users },
  ];

  const { scrollYProgress } = useScroll();
  const scale = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
  };

  return (
    <div className={`relative min-h-screen ${theme.bgDarkClass} ${theme.textLight} overflow-visible`} style={{ position: 'relative', zIndex: 1 }}>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-6 py-20" style={{ zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
        <div className="flex justify-center mb-6">
          
       <Spline scene="https://draft.spline.design/01k1AO1jMFy7JJm5/scene.splinecode" />

          </div>
        </motion.div>
      </section>

{/* How It Works Section */}
<section id="how-it-works" className="relative py-20 px-6">
  <div className="max-w-7xl mx-auto space-y-16">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
      variants={fadeInUpVariant}
      className="text-center space-y-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-10 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
    >
      <div className="inline-block px-4 py-2 text-sm bg-blue-500/20 border border-blue-400 text-blue-300 rounded-full">
        THE PROCESS
      </div>
      <h2 className="text-5xl font-extrabold text-white">How AstroNots Works</h2>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto">
        Our streamlined process is designed to bring you the most relevant and insightful information from NASA's vast knowledge base.
      </p>
    </motion.div>

    <div className="relative">
      <div className="absolute left-1/2 -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 via-cyan-500 to-indigo-500 rounded-full opacity-20 hidden md:block" />

      {howItWorksSteps.map((step, index) => {
        const Icon = step.icon;
        const isEven = index % 2 === 0;
        return (
          <motion.div
            key={step.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0, x: isEven ? -100 : 100 },
              visible: { 
                opacity: 1, 
                x: 0,
                transition: { duration: 0.7, delay: index * 0.1 }
              },
            }}
            className="relative md:grid md:grid-cols-2 gap-12 items-center my-16 md:my-24"
          >
            <div className={isEven ? "md:col-start-1" : "md:col-start-2"}>
              <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 space-y-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300`}>
                <div className="flex items-center gap-5 mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="mb-2 inline-block px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-sm">
                      Step {step.id}
                    </div>
                    <h3 className="text-3xl font-bold text-white leading-tight">{step.title}</h3>
                  </div>
                </div>
                <p className="text-gray-300 text-lg">{step.description}</p>
                <ul className="space-y-3">
                  {step.details.map((detail, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-3 text-gray-400 text-base"
                    >
                      <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full flex-shrink-0 shadow-sm shadow-cyan-400/50" />
                      {detail}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={`hidden md:flex justify-center items-center ${isEven ? "md:col-start-2" : "md:col-start-1"}`}>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.03, 0.97, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.8,
                }}
                className={`w-56 h-56 lg:w-72 lg:h-72 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center opacity-20 border border-blue-400/20 shadow-lg`}
              >
                <Icon className="w-28 h-28 text-white opacity-80" />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
</section>

      {/* About Team Section */}
<section id="about-team" className="relative py-20 px-6">
  <div className="max-w-7xl mx-auto space-y-16">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
      variants={fadeInUpVariant}
      className="text-center space-y-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-10 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
    >
      <div className="inline-block px-4 py-2 text-sm bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded-full">
        OUR CREATORS
      </div>
      <h2 className="text-5xl font-extrabold text-white">Meet the AstroNots Team</h2>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto">
        We are a diverse group of passionate innovators, united by our mission to explore the cosmos through cutting-edge AI.
      </p>
    </motion.div>

    {/* Project Stats */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
      variants={fadeInUpVariant}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {projectStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="text-center space-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>

    {/* Team Members Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
      {teamMembers.map((member, index) => {
        const Icon = member.icon;
        return (
          <motion.div
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0, y: 60 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.6, delay: index * 0.1 }
              },
            }}
            className="h-full"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl h-full flex flex-col hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl flex-shrink-0">{member.avatar}</div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-white">{member.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Icon className="w-4 h-4" />
                    <p className="text-base">{member.role}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-4 flex-grow">{member.description}</p>
              <div className="mb-4">
                <h4 className="text-white font-medium mb-2 text-lg">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, i) => (
                    <span key={i} className="inline-block bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-auto flex gap-2 pt-4 border-t border-blue-500/20">
                <button className="p-2 border border-blue-400/30 text-gray-300 hover:text-white hover:bg-blue-500/20 hover:border-blue-400 transition-colors rounded-md" aria-label={`GitHub profile of ${member.name}`}>
                  <Github className="w-5 h-5" />
                </button>
                <button className="p-2 border border-blue-400/30 text-gray-300 hover:text-white hover:bg-blue-500/20 hover:border-blue-400 transition-colors rounded-md" aria-label={`LinkedIn profile of ${member.name}`}>
                  <Linkedin className="w-5 h-5" />
                </button>
                <button className="p-2 border border-blue-400/30 text-gray-300 hover:text-white hover:bg-blue-500/20 hover:border-blue-400 transition-colors rounded-md" aria-label={`Email ${member.name}`}>
                  <Mail className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
          {/* Mission Statement */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariant}
            className="pt-10"
          >
            <div className={`${theme.cardBg} rounded-xl shadow-2xl shadow-blue-500/10 p-8 text-center`}>
              <h3 className="text-3xl font-bold text-white mb-4">Our Collective Mission</h3>
              <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
                At AstroNots, we are driven by the belief that critical space research should be universally accessible. Our AI-driven platform acts as a bridge, transforming complex scientific data into clear, actionable insights. We empower scientists to formulate novel hypotheses, guide investors to identify pioneering opportunities, and enable mission architects to design safer, more efficient journeys beyond Earth.
              </p>
              <div className="mt-8">
                <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-lg px-6 py-2 rounded-full shadow-lg">
                  Democratizing Space Science with AI
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 bg-gradient-to-t from-[#0a0e27] via-[#0f1420]/50 to-transparent mt-20 pb-32" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto text-center px-6">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} AstroNots – Exploring the Cosmos with AI
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <a href="#" className="text-gray-400 hover:text-cyan-300 transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-cyan-300 transition-colors text-sm">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Fixed Explore Now Button - Always on Top */}
      <motion.div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ zIndex: 100000 }}
      >
        <button
          onClick={() => alert('Get Started!')}
          className="px-12 py-6 text-xl font-bold rounded-full shadow-2xl transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white hover:shadow-blue-500/50 hover:scale-105 pointer-events-auto cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-6 h-6" /> 
          Explore Now
        </button>
      </motion.div>

      {/* Floating Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 p-4 rounded-full shadow-lg text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:shadow-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-400/50 pointer-events-auto cursor-pointer"
        style={{ zIndex: 99998 }}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-6 h-6" />
      </motion.button>
    </div>
  );
}