// @ts-nocheck -- this file mixes some JS patterns; narrow, non-invasive safety checks added below
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Rocket, Users, Target, Brain, TrendingUp, Map } from 'lucide-react';
import { useAuth } from '../auth/context/AuthContext';
import { toast } from 'sonner';

/**
 * @typedef {{ onUserTypeChange?: (userType: string) => void }} LoginPageProps
 */
/**
 * LoginPage component
 * @param {LoginPageProps} props
 */
export default function LoginPage(props) {
  const { onUserTypeChange } = props || {};
  const { signIn, signUp, loading } = useAuth() || {};
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('scientist');
  const [error, setError] = useState('');

  const userTypes = [
    {
      id: 'scientist',
      title: 'Scientist',
      icon: Brain,
      description: 'Generate new hypotheses and analyze research',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'investor',
      title: 'Manager/Investor',
      icon: TrendingUp,
      description: 'Identify investment opportunities',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'mission-architect',
      title: 'Mission Architect',
      icon: Map,
      description: 'Plan Moon and Mars missions safely',
      color: 'from-red-500 to-orange-500'
    }
  ];

  const teamMembers = [
    { name: 'Kartavya', role: 'RAG System and Frontend', avatar: '🚀' },
    { name: 'Surya Srivastava', role: 'Knowldge Graph builder', avatar: '🛰' },
    { name: 'Saksham Setia', role: 'Backend', avatar: '✨' },
    { name: 'Yash Sharma', role: 'Data Scientist', avatar: '📊' },
    { name: 'Sapphire ..', role: 'Knowledge Graph', avatar: '🎨' },
    { name: 'Sanvi ..', role: 'UI/UX Designer', avatar: '🎨' }
  ];

  const handleAuth = async () => {
    try {
      // Validation
      if (!email.trim()) {
        throw new Error('Please enter your email address');
      }
      if (!password) {
        throw new Error('Please enter your password');
      }
      if (!isLogin && !name.trim()) {
        throw new Error('Please enter your full name');
      }
      if (!isLogin && password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      let result;
      if (isLogin) {
        // Supabase sign in
        result = await signIn(email.trim(), password);
        if (!result?.data?.user || result?.error) {
          const errorMsg = result?.error?.message || 'Sign in failed. Please check your credentials.';
          toast.error(errorMsg);
          return;
        }
        const userType = result?.data?.user?.user_type || selectedUserType;
        if (onUserTypeChange) onUserTypeChange(userType);
        toast.success('Welcome back to AstroNots!');
      } else {
        // Supabase sign up
        result = await signUp(email.trim(), password, selectedUserType, name.trim());
        if (!result?.data?.user || result?.error) {
          const errorMsg = result?.error?.message || 'Sign up failed. Please try again.';
          toast.error(errorMsg);
          return;
        }
        if (onUserTypeChange) onUserTypeChange(selectedUserType);
        toast.success('Welcome to AstroNots! 🚀');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || 'An unexpected error occurred');
      console.error('Auth error:', error);
    }
  };

  // Basic sanitization for external image URLs to avoid accidental injection
  const safeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    try {
      // use the URL constructor to validate
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
    } catch (e) {
      // invalid URL
    }
    return '';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await signIn(email, password);
    if (!result.success) {
      setError(result.error?.message || 'Login failed');
    } else {
      // Redirect or show success
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden relative">
      {/* Background Images */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 right-0 w-1/3 h-1/2 opacity-20"
        >
          <img
            src={safeImageUrl('https://images.unsplash.com/photo-1607539594630-e86855287bc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJzJTIwcGxhbmV0JTIwc3BhY2UlMjBleHBsb3JhdGlvbnxlbnwxfHx8fDE3NTkzMDcwMTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')}
            alt="Space Station"
            className="w-full h-full object-cover rounded-lg"
          />
        </motion.div>
        <motion.div
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-1/4 h-1/3 opacity-15"
        >
          <img
            src={safeImageUrl('https://images.unsplash.com/photo-1614729375290-b2a429db839b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxyb2NrZXQlMjBsYXVuY2glMjBzcGFjZWNyYWZ0fGVufDF8fHx8MTc1OTMwNzAyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')}
            alt="Rocket Launch"
            className="w-full h-full object-cover rounded-lg"
          />
        </motion.div>
      </div>
      
      {/* Animated background elements */}
<div className="absolute inset-0 overflow-hidden">
  {[...Array(20)].map((_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 bg-white rounded-full opacity-20"
      animate={{
        x: [0, Math.random() * 100, 0],
        y: [0, Math.random() * 100, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: Math.random() * 10 + 10,
        repeat: Infinity,
        delay: Math.random() * 5,
      }}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
    />
  ))}
</div>


      <div className="relative z-10 container mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8 min-h-screen">
        {/* Left side - Branding and Info */}
        <div className="flex flex-col justify-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
              >
                <Rocket className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-white">AstroNots</h1>
                <p className="text-purple-300">NASA Space Apps Challenge 2024</p>
              </div>
            </div>

            <div className="space-y-4 text-gray-300 mb-8">
              <p className="text-xl">
                Revolutionizing space research analysis with AI-powered insights
              </p>
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span>Analyze NASA research papers with advanced AI</span>
                </div>
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span>Generate custom explanations for your field</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-400" />
                  <span>Collaborative research platform</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Team Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Meet the AstroNots Team</h3>
            <div className="grid grid-cols-2 gap-4">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                >
                  <div className="text-2xl mb-2">{member.avatar}</div>
                  <h4 className="text-white font-medium">{member.name}</h4>
                  <p className="text-gray-400 text-sm">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">
                  {isLogin ? 'Welcome Back' : 'Join AstroNots'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Type Selection */}
                <div className="space-y-3">
                  <label className="text-white text-sm font-medium">I am a:</label>
                  <div className="grid gap-3">
                    {userTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <motion.div
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedUserType(type.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedUserType === type.id
                              ? 'border-white bg-white/20'
                              : 'border-white/30 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{type.title}</h4>
                              <p className="text-gray-300 text-sm">{type.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {!isLogin && (
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                    required
                  />
                )}
                
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  required
                />
                
                <Input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  required
                  minLength={6}
                />

                <Button 
                  onClick={handleAuth}
                  disabled={!email || !password || (!isLogin && !name) || loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {isLogin ? 'Launch Mission' : 'Join the Crew'}
                </Button>

                {/* Demo Account Buttons */}
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm text-center">Try demo accounts:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      onClick={async () => {
                        setEmail('scientist@astronots.space');
                        setPassword('science123');
                        setName('Dr. Sarah Chen');
                        setSelectedUserType('scientist');
                        setIsLogin(true);
                        toast.success('Scientist demo loaded! Now click "Launch Mission"');
                      }}
                      variant="outline"
                      size="sm"
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 text-xs"
                    >
                      🔬 Scientist
                    </Button>
                    <Button 
                      onClick={() => {
                        setEmail('investor@astronots.space');
                        setPassword('invest123');
                        setName('Mike Johnson');
                        setSelectedUserType('investor');
                        setIsLogin(true);
                        toast.success('Investor demo loaded! Now click "Launch Mission"');
                      }}
                      variant="outline"
                      size="sm"
                      className="border-green-500/30 text-green-300 hover:bg-green-500/10 text-xs"
                    >
                      💰 Investor
                    </Button>
                    <Button 
                      onClick={() => {
                        setEmail('architect@astronots.space');
                        setPassword('mission123');
                        setName('Emma Rodriguez');
                        setSelectedUserType('mission-architect');
                        setIsLogin(true);
                        toast.success('Mission Architect demo loaded! Now click "Launch Mission"');
                      }}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs"
                    >
                      🚀 Architect
                    </Button>
                  </div>
                  
                  {/* Quick Login Button for Testing */}
                  <Button 
                    onClick={async () => {
                      try {
                        console.log('Attempting quick login with scientist@astronots.space');
                        
                        if (!signIn) {
                          console.error('Sign in function is not available');
                          toast.error('Authentication service is not available');
                          return;
                        }
                        
                        const result = await signIn('scientist@astronots.space', 'science123');
                        console.log('Quick login result:', result);
                        
                        if (!result?.success || result?.error) {
                          const errorMsg = result?.error?.message || 'Quick login failed';
                          console.error('Quick login error:', errorMsg);
                          toast.error(errorMsg);
                        } else {
                          if (onUserTypeChange) {
                            onUserTypeChange('scientist');
                          }
                          toast.success('Quick login successful!');
                        }
                      } catch (err) {
                        console.error('Quick login error:', err);
                        toast.error('Login failed: ' + (err?.message || String(err)));
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
                  >
                    ⚡ Quick Login (Scientist)
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-purple-300 hover:text-white transition-colors text-sm"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>

                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Example for your AuthContext (not in this file)
async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

async function signUp(email, password, userType, name) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: userType,
        name: name,
      },
    },
  });
}