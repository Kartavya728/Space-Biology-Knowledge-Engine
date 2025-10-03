import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

// Create context with default value
const AuthContext = createContext({
  session: null,
  signIn: async () => ({ success: false, error: { message: "Not initialized" } }),
  signUp: async () => ({ success: false, error: { message: "Not initialized" } }),
  signOut: async () => ({ success: false, error: { message: "Not initialized" } })
});

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const DEMO_EMAIL = "demo@demo.com";
  const DEMO_PASSWORD = "demo123";

  // --- Sign Up ---
  const signUp = async (email, password, userType = "scientist", name) => {
    try {
      // create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            name: name,
          },
        },
      });
      if (error) {
        console.log("Error signing up:", error.message);
        return { success: false, error };
      }

      // insert profile row if user created
      const userId = data?.user?.id;
      if (userId) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([{ id: userId, email, user_type: userType }]);

        if (insertError) {
          console.warn("Warning: failed to insert profile row:", insertError.message);
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error };
    }
  };

  // --- Sign In ---
  // Modified to support demo account
  const signIn = async (email, password) => {
    // Demo account bypass
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const demoSession = {
        user: {
          id: "demo-user-id",
          email: DEMO_EMAIL,
          user_type: "demo",
          name: "Demo User"
        },
        access_token: "demo-access-token"
      };
      setSession(demoSession);
      return { success: true, data: demoSession };
    }

    // Regular Supabase sign in
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.log("Error signing in:", error.message);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (error) {
      console.log("Error signing in:", error.message);
      return { success: false, error };
    }
  };

  // --- Sign Out ---
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log("Error signing out:", error.message);
        return { success: false, error };
      }
      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      return { success: false, error };
    }
  };

  // --- Session Management ---
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    signIn,
    signUp,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export function useAuth() {
  return useContext(AuthContext);
}