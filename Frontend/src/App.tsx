import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { mockAuth } from './utils/auth/mockAuth';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState('scientist'); // scientist, investor, mission-architect

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session }, error } = mockAuth.getSession();
      if (session?.user) {
        setUser(session.user);
        setUserType(session.user.userType || 'scientist');
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = mockAuth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setUserType(session.user.userType || 'scientist');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await mockAuth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onUserTypeChange={setUserType} />;
  }

  return (
    <>
      <Dashboard 
        user={user} 
        userType={userType}
        onUserTypeChange={setUserType}
        onSignOut={handleSignOut} 
      />
      <Toaster />
    </>
  );
}