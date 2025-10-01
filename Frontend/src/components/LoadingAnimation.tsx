import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Brain, Search, Zap, Database, Sparkles, Atom } from 'lucide-react';

export function LoadingAnimation({ userType }) {
  const getLoadingSteps = () => {
    switch (userType) {
      case 'scientist':
        return [
          { icon: Search, text: 'Scanning research papers...', color: 'text-blue-400' },
          { icon: Brain, text: 'Analyzing methodologies...', color: 'text-cyan-400' },
          { icon: Atom, text: 'Processing scientific data...', color: 'text-blue-300' },
          { icon: Sparkles, text: 'Generating insights...', color: 'text-blue-500' }
        ];
      case 'investor':
        return [
          { icon: Search, text: 'Evaluating market potential...', color: 'text-green-400' },
          { icon: Database, text: 'Analyzing commercial applications...', color: 'text-emerald-400' },
          { icon: Brain, text: 'Processing investment data...', color: 'text-green-300' },
          { icon: Sparkles, text: 'Generating opportunities...', color: 'text-green-500' }
        ];
      case 'mission-architect':
        return [
          { icon: Search, text: 'Reviewing mission parameters...', color: 'text-red-400' },
          { icon: Zap, text: 'Assessing safety protocols...', color: 'text-orange-400' },
          { icon: Brain, text: 'Planning mission architecture...', color: 'text-red-300' },
          { icon: Sparkles, text: 'Optimizing efficiency...', color: 'text-red-500' }
        ];
      default:
        return [
          { icon: Search, text: 'Searching knowledge base...', color: 'text-purple-400' },
          { icon: Brain, text: 'Processing information...', color: 'text-pink-400' },
          { icon: Database, text: 'Analyzing patterns...', color: 'text-purple-300' },
          { icon: Sparkles, text: 'Generating response...', color: 'text-purple-500' }
        ];
    }
  };

  const loadingSteps = getLoadingSteps();

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Main Loading Indicator */}
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              {/* Outer ring */}
              <div className="w-24 h-24 border-4 border-white/20 rounded-full"></div>
              {/* Inner spinning element */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-4 border-transparent border-t-white border-r-white rounded-full"
              ></motion.div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Brain className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Loading Steps */}
          <div className="space-y-4">
            {loadingSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: index * 0.8,
                    duration: 0.5
                  }}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1, repeat: Infinity, delay: index * 0.2 }
                    }}
                  >
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </motion.div>
                  <span className="text-white">{step.text}</span>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ 
                      delay: index * 0.8 + 0.5,
                      duration: 2
                    }}
                    className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden ml-auto max-w-32"
                  >
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        delay: index * 0.8 + 0.5,
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className={`h-full w-1/3 bg-gradient-to-r ${
                        userType === 'scientist' 
                          ? 'from-blue-500 to-cyan-500'
                          : userType === 'investor'
                          ? 'from-green-500 to-emerald-500'
                          : userType === 'mission-architect'
                          ? 'from-red-500 to-orange-500'
                          : 'from-purple-500 to-pink-500'
                      }`}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Pulse Effect */}
          <div className="flex justify-center">
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center">
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/80"
            >
              AI Agent is analyzing your request...
            </motion.p>
            <p className="text-gray-400 text-sm mt-2">
              This may take a few moments for complex analyses
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}