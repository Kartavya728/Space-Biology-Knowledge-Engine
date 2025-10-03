import { useState, useEffect } from "react";
import { motion } from "motion/react";
import LoginPage from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { HomePage } from "./components/HomePage";
import { FloatingButton } from "./components/FloatingButton";
import { AuthContextProvider, useAuth } from "./auth/context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import StarsCanvas from "./components/main/StarBackground";

function App() {
  console.log("🎨 App component rendering...");
  
  const { session, loading, signOut } = useAuth();
  const [userType, setUserType] = useState("scientist");
  const [showHome, setShowHome] = useState(true);

  console.log("App state:", { 
    hasSession: !!session, 
    hasUser: !!session?.user, 
    loading, 
    showHome,
    userEmail: session?.user?.email 
  });

  useEffect(() => {
    if (session?.user) {
      console.log("✅ User logged in, hiding home page");
      setShowHome(false);
      // Fetch user type from user metadata or profiles table if needed
      const metadata = session.user.user_metadata;
      if (metadata?.user_type) {
        setUserType(metadata.user_type);
      }
    } else {
      console.log("❌ No session, showing home page");
    }
  }, [session]);

  const handleSignOut = async () => {
    console.log("👋 Signing out...");
    await signOut();
    setShowHome(true);
  };

  if (loading) {
    console.log("⏳ Loading...");
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

  if (showHome && !session) {
    console.log("🏠 Showing home page");
    return (
      <>
        <StarsCanvas />
        <HomePage onGetStarted={() => setShowHome(false)} />
        <FloatingButton onClick={() => setShowHome(false)} />
      </>
    );
  }

  if (!session?.user) {
    console.log("🔐 Showing login page");
    return (
      <>
        <StarsCanvas />
        <LoginPage />
        <Toaster />
      </>
    );
  }

  console.log("📊 Showing dashboard");
  return (
    <>
      <StarsCanvas />
      <Dashboard
        user={session?.user} // Pass session.user
        userType={userType}
        onUserTypeChange={setUserType}
        onSignOut={handleSignOut}
      />
      <Toaster />
    </>
  );
}

export default function WrappedApp() {
  return (
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
  );
}