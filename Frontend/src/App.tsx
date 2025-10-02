import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { HomePage } from "./components/HomePage";
import { FloatingButton } from "./components/FloatingButton";
import { mockAuth } from "./utils/auth/mockAuth";
import { Toaster } from "./components/ui/sonner";
import StarsCanvas from "./components/main/StarBackground"; // ✅ make sure this matches file name

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState("scientist");
  const [showHome, setShowHome] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = mockAuth.getSession();
      if (session?.user) {
        setUser(session.user);
        setUserType(session.user.userType || "scientist");
        setShowHome(false);
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = mockAuth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          setUserType(session.user.userType || "scientist");
          setShowHome(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setShowHome(true);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await mockAuth.signOut();
    setUser(null);
    setShowHome(true);
  };

  if (loading) {
    return (
      <>
        <StarsCanvas />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </>
    );
  }

  if (showHome) {
    return (
      <>
        <StarsCanvas />
        <HomePage onGetStarted={() => setShowHome(false)} />
        <FloatingButton onClick={() => setShowHome(false)} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <StarsCanvas />
        <LoginPage onUserTypeChange={setUserType} />
      </>
    );
  }

  return (
    <>
      <StarsCanvas />
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
