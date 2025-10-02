import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, TrendingUp, Map, Sparkles, Zap, Atom } from 'lucide-react';


export function AIAgent3D({ userType, isThinking }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    let animationId;
    let particles = [];
    let time = 0;

    // Initialize particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        hue: Math.random() * 360
      });
    }

    const getThemeColor = () => {
      switch (userType) {
        case 'scientist':
          return { primary: '#3b82f6', secondary: '#06b6d4' };
        case 'investor':
          return { primary: '#10b981', secondary: '#34d399' };
        case 'mission-architect':
          return { primary: '#ef4444', secondary: '#f97316' };
        default:
          return { primary: '#8b5cf6', secondary: '#a855f7' };
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      const colors = getThemeColor();
      
      // Draw central core
      const coreSize = isThinking ? 60 + Math.sin(time * 4) * 10 : 50;
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, coreSize);
      gradient.addColorStop(0, colors.primary + '80');
      gradient.addColorStop(1, colors.secondary + '20');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(width/2, height/2, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw orbiting rings
      for (let i = 0; i < 3; i++) {
        const radius = 80 + i * 20;
        const rotationSpeed = 0.5 + i * 0.2;
        const angle = time * rotationSpeed;
        
        ctx.strokeStyle = colors.primary + '40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width/2, height/2, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw nodes on rings
        for (let j = 0; j < 6; j++) {
          const nodeAngle = angle + (j * Math.PI * 2) / 6;
          const x = width/2 + Math.cos(nodeAngle) * radius;
          const y = height/2 + Math.sin(nodeAngle) * radius;
          
          ctx.fillStyle = colors.secondary;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Animate particles
      particles.forEach(particle => {
        particle.x += particle.vx * (isThinking ? 2 : 1);
        particle.y += particle.vy * (isThinking ? 2 : 1);
        
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        
        const alpha = isThinking ? 0.8 : 0.4;
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw thinking waves if active
      if (isThinking) {
        for (let i = 0; i < 3; i++) {
          const waveRadius = 100 + i * 30 + Math.sin(time * 3 + i) * 20;
          ctx.strokeStyle = colors.primary + '30';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(width/2, height/2, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [userType, isThinking]);

  const getAgentIcon = () => {
    switch (userType) {
      case 'scientist':
        return Brain;
      case 'investor':
        return TrendingUp;
      case 'mission-architect':
        return Map;
      default:
        return Sparkles;
    }
  };

  const getAgentTitle = () => {
    switch (userType) {
      case 'scientist':
        return 'Scientific Analysis Agent';
      case 'investor':
        return 'Investment Analysis Agent';
      case 'mission-architect':
        return 'Mission Planning Agent';
      default:
        return 'AI Research Agent';
    }
  };

  const AgentIcon = getAgentIcon();

  return (
    <div className="relative">
      {/* 3D Canvas Background */}
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="rounded-xl"
      />
      
      {/* Overlay Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          animate={isThinking ? { 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          } : { scale: 1, rotate: 0 }}
          transition={{ 
            duration: isThinking ? 2 : 0.5,
            repeat: isThinking ? Infinity : 0
          }}
          className="mb-4"
        >
          <AgentIcon className="w-12 h-12 text-white drop-shadow-lg" />
        </motion.div>
        
        <h3 className="text-white font-semibold text-lg text-center drop-shadow-lg">
          {getAgentTitle()}
        </h3>
        
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Atom className="w-4 h-4 text-white/80" />
            </motion.div>
            <span className="text-white/80 text-sm">Analyzing research...</span>
          </motion.div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2">
          {['neural', 'quantum', 'cosmic'].map((type, index) => (
            <motion.div
              key={type}
              animate={isThinking ? {
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              } : { scale: 1, opacity: 0.5 }}
              transition={{
                duration: 1.5,
                repeat: isThinking ? Infinity : 0,
                delay: index * 0.2
              }}
              className="w-2 h-2 bg-white rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}