import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const HistoryManagerContext = createContext();
export const useHistoryManager = () => useContext(HistoryManagerContext);


export const HistoryManagerProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);


   useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  
    return () => subscription.unsubscribe();
  }, []);
  
  const createHistory = async ( query, assistantReply) => {
    if (!session){
      console.log("404: session not found");
      return { success: false, error: "No session" };
    }
    const newHistory = [{ user_id: session.user.id, query: query , response: assistantReply }];
    try {
      const { data, error } = await supabase.from('history').insert(newHistory);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error storing history:', error);
      return { success: false, error };
    }
  };

  const getHistory = async () => {
    if (!session?.user?.id) {
      console.error("No valid session, cannot fetch history");
      return { success: false, error: "No session" };
    }
  
    try {
      const { data, error } = await supabase
        .from("history")
        .select("id, query, response, created_at") // pick only needed cols
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
  
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error getting history:", error);
      return { success: false, error };
    }
  };
  

  return (
    <HistoryManagerContext.Provider value={{ session, loading, createHistory, getHistory }}>
      {children}
    </HistoryManagerContext.Provider>
  );
};