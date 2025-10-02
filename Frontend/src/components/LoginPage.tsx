import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Rocket, Users, Target, Brain, TrendingUp, Map } from 'lucide-react';
import { useAuth } from '../auth/context/AuthContext';
import { toast } from 'sonner';

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('scientist');
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();

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
    { name: 'Surya Shrivastav', role: 'Knowledge Graph builder', avatar: '🛰️' },
    { name: 'Yash Sharma', role: 'Data Scientist', avatar: '📊' },
    { name: 'Sapphire', role: 'Knowledge Graph', avatar: '💎' },
    { name: 'Sanvi', role: 'UI/UX Designer', avatar: '🎨' },
    { name: 'Saksham Sethia', role: 'Backend', avatar: '⚙️' }
  ];

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!email.trim() || !password) {
        setError('Please fill in all fields.');
        toast.error('Please fill in all fields.');
        return;
      }

      if (isLogin) {
        // ============ Sign In Logic ============
        const result = await signIn(email.trim(), password);
        if (!result.success) {
          setError(result.error?.message || 'Sign-in failed.');
          toast.error(result.error?.message || 'Sign-in failed.');
          return;
        }
        
        // Success - App.tsx will handle navigation via session state
        toast.success('Welcome back to AstroNots!');
        
        // Clear form
        setEmail('');
        setPassword('');
      } else {
        // ============ Sign Up Logic ============
        if (!name.trim()) {
          setError('Please enter your full name.');
          toast.error('Please enter your full name.');
          return;
        }
        
        if (!confirmPassword) {
          setError('Please confirm your password.');
          toast.error('Please confirm your password.');
          return;
        }
        
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          toast.error('Passwords do not match.');
          return;
        }
        
        if (password.length < 8) {
          setError('Password must be at least 8 characters long.');
          toast.error('Password must be at least 8 characters long.');
          return;
        }

        // Sign up with selectedUserType
        const result = await signUp(email.trim(), password, selectedUserType);
        if (!result.success) {
          setError(result.error?.message || 'Error during sign up.');
          toast.error(result.error?.message || 'Error during sign up.');
          return;
        }
        
        // Success - App.tsx will handle navigation via session state
        toast.success(`Successfully registered! Welcome to AstroNots! 🚀`);
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
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
            src="https://images.unsplash.com/photo-1607539594630-e86855287bc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJzJTIwcGxhbmV0JTIwc3BhY2UlMjBleHBsb3JhdGlvbnxlbnwxfHx8fDE3NTkzMDcwMTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
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
            src="https://images.unsplash.com/photo-1614729375290-b2a429db839b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxyb2NrZXQlMjBsYXVuY2glMjBzcGFjZWNyYWZ0fGVufDF8fHx8MTc1OTMwNzAyMXww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Rocket Launch"
            className="w-full h-full object-cover rounded-lg"
          />
        </motion.div>
      </div>
      
      {/* Animated background elements - Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
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
                <CardTitle className="text-white text-center text-2xl">
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

                {/* Name field - only for signup */}
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
                
                {/* Email field */}
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  required
                />
                
                {/* Password field */}
                <Input
                  type="password"
                  placeholder={isLogin ? "Password" : "Password (min 8 characters)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  required
                  minLength={isLogin ? undefined : 8}
                />

                {/* Confirm Password field - only for signup */}
                {!isLogin && (
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                    required
                  />
                )}

                {/* Error message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  onClick={handleAuth}
                  disabled={loading || !email || !password || (!isLogin && (!name || !confirmPassword))}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    isLogin ? 'Launch Mission' : 'Join the Crew'
                  )}
                </Button>

                {/* Demo Account Buttons - Only show in login mode */}
                {isLogin && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm text-center">Try demo accounts:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        onClick={() => {
                          setEmail('scientist@astronots.space');
                          setPassword('science123');
                          setSelectedUserType('scientist');
                          toast.success('Scientist demo loaded! Now click "Launch Mission"');
                        }}
                        variant="outline"
                        size="sm"
                        className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 text-xs"
                        type="button"
                      >
                        🔬 Scientist
                      </Button>
                      <Button 
                        onClick={() => {
                          setEmail('investor@astronots.space');
                          setPassword('invest123');
                          setSelectedUserType('investor');
                          toast.success('Investor demo loaded! Now click "Launch Mission"');
                        }}
                        variant="outline"
                        size="sm"
                        className="border-green-500/30 text-green-300 hover:bg-green-500/10 text-xs"
                        type="button"
                      >
                        💰 Investor
                      </Button>
                      <Button 
                        onClick={() => {
                          setEmail('architect@astronots.space');
                          setPassword('mission123');
                          setSelectedUserType('mission-architect');
                          toast.success('Mission Architect demo loaded! Now click "Launch Mission"');
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs"
                        type="button"
                      >
                        🚀 Architect
                      </Button>
                    </div>
                    
                    {/* Quick Login Button for Testing */}
                    <Button 
                      onClick={async () => {
                        try {
                          setLoading(true);
                          setEmail('scientist@astronots.space');
                          setPassword('science123');
                          const result = await signIn('scientist@astronots.space', 'science123');
                          if (!result.success) {
                            toast.error(result.error?.message || 'Quick login failed');
                          } else {
                            toast.success('Quick login successful!');
                            // App.tsx handles navigation
                          }
                        } catch (err) {
                          console.error('Quick login error:', err);
                          toast.error('Login failed: ' + (err as Error).message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
                      type="button"
                    >
                      ⚡ Quick Login (Scientist)
                    </Button>
                  </div>
                )}

                {/* Toggle between Sign In and Sign Up */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setEmail('');
                      setPassword('');
                      setConfirmPassword('');
                      setName('');
                    }}
                    className="text-purple-300 hover:text-white transition-colors text-sm"
                    type="button"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Export both named and default
export { LoginPage };
export default LoginPage;