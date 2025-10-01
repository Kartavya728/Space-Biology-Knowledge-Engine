import React from "react";
import { motion } from "motion/react";
import { Rocket, Target, Brain, Users } from "lucide-react";
import { Button } from "./ui/button";

export const HomePage = ({ onGetStarted }) => {
  return (
    <>
    <div className="relative min-h-screen bg-black text-white ">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover -z-20 filter brightness-50"
      >
        <source
          src="../../856309-hd_1920_1080_30fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Floating stars / particles */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25, 0],
              y: [0, Math.random() * 50 - 25, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 md:px-20 text-center space-y-6 max-w-7xl mx-auto">
        {/* Logo + title */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row items-center gap-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
          >
            <Rocket className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <h1 className="text-5xl font-bold leading-tight">AstroNots</h1>
            <p className="text-purple-300 text-lg mt-2">
              NASA Space Apps Challenge 2024
            </p>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto"
        >
          Revolutionizing space research with{" "}
          <span className="text-purple-400">AI-powered insights</span>.
        </motion.p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 w-full">
          {[
            { icon: Target, text: "Analyze NASA research with AI" },
            { icon: Brain, text: "Generate custom scientific insights" },
            { icon: Users, text: "Collaborate with global researchers" },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 flex flex-col items-center"
              >
                <Icon className="w-10 h-10 mb-4 text-purple-400" />
                <p className="text-center text-gray-200 text-lg">{feature.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* How it Works Section */}
      <section className="py-20 bg-gradient-to-b from-black via-slate-900 to-black">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">How It Works</h2>
          <p className="text-gray-300 text-lg">
            Upload NASA datasets, choose the parameters, and let our AI engine generate actionable insights for space research.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { step: "1", desc: "Upload data files or select datasets from NASA APIs." },
              { step: "2", desc: "AI analyzes, visualizes patterns, and generates insights." },
              { step: "3", desc: "Download reports, visualize trends, and collaborate with researchers globally." },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
              >
                <div className="text-purple-400 text-3xl font-bold mb-2">{item.step}</div>
                <p className="text-gray-200">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">Benefits of Using AstroNots</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              "AI-driven insights in minutes",
              "Collaborative platform for researchers",
              "Visualize complex datasets easily",
            ].map((benefit, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-purple-900/40 backdrop-blur-sm rounded-lg p-6 border border-white/20"
              >
                <p className="text-gray-200 text-lg font-medium">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="py-20 bg-gradient-to-b from-black via-slate-900 to-black">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">Our Approach</h2>
          <p className="text-gray-300 text-lg">
            We combine cutting-edge AI algorithms with NASA datasets to provide interpretable, actionable insights for space research.
          </p>
        </div>
      </section>

      {/* About Team / Footer */}
      <footer className="py-12 bg-gradient-to-t from-black via-slate-900 to-black">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h3 className="text-2xl font-bold text-white">About Our Team</h3>
          <p className="text-gray-400">
            A passionate group of space enthusiasts, data scientists, and developers working together to revolutionize space research.
          </p>
          <p className="text-gray-500 text-sm">© 2024 AstroNots. All rights reserved.</p>
        </div>
      </footer>

    </div>
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={onGetStarted}
          className="px-6 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg animate-bounce"
        >
          🚀 Explore Now!
        </Button>
      </div>
    </>
  );
};
