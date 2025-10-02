import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const FloatingButton = ({ onClick }) => {
  return (
    <motion.div
      style={{
        position: "fixed",
        bottom: "2.5rem", // 40px from bottom
        left: "45%",      // horizontally center
        transform: "translateX(-50%)", // perfect center
        zIndex: 99999,    // always on top
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="
          flex items-center justify-center
          min-w-[240px] px-6 py-5
          text-lg font-bold rounded-full shadow-2xl
          bg-gradient-to-r from-blue-500 to-cyan-500
          text-white hover:from-blue-600 hover:to-cyan-600
          hover:shadow-blue-500/50
          pointer-events-auto
        "
      >
        <Sparkles className="w-5 h-6 mr-2" /> {/* icon before text */}
        Explore Now
      </motion.button>
    </motion.div>
  );
};
