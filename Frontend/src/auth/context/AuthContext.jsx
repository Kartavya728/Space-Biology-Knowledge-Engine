import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../superbaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);

  // --- Sign Up ---
  const signUp = async (email, password, userType = "A") => {
    // create auth user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.log("Error signing up:", error.message);
      return { success: false, error };
    }

    // insert profile row if user created (note: may not work immediately if email confirmation is enabled)
    const userId = data?.user?.id;
    if (userId) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([{ id: userId, email, user_type: userType }]);

      if (insertError) {
        console.warn("Warning: failed to insert profile row:", insertError.message);
        // you can choose to return failure if your app depends on this
      }
    }

    return { success: true, data };
  };

  // --- Session Management ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Sign Out ---
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("Error signing out:", error.message);
    }
  };

  // --- Sign In ---
  const signIn = async (email, password) => {
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

  return (
    <AuthContext.Provider value={{ session, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};