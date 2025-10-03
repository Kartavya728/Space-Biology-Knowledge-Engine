import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { HowItWorks } from './HowItWorks';
import { AboutTeam } from './AboutTeam';
import StarBackground from '../components/main/StarBackground';
import { DataGallery } from './DataGallery';

export function Dashboard({ user, userType, onUserTypeChange, onSignOut }) {
  const [currentPage, setCurrentPage] = useState('main');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);

  const getThemeColors = () => {
    switch (userType) {
      case 'scientist':
        return {
          primary: 'from-blue-500 to-cyan-500',
          background: 'from-slate-900 via-black-900 to-slate-900',
          accent: 'blue'
        };
      case 'investor':
        return {
          primary: 'from-green-500 to-emerald-500',
          background: 'from-slate-900 via-black-900 to-slate-900',
          accent: 'green'
        };
      case 'mission-architect':
        return {
          primary: 'from-red-500 to-orange-500',
          background: 'from-slate-900 via-amber-900 to-slate-900',
          accent: 'amber'
        };
      default:
        return {
          primary: 'from-purple-500 to-pink-500',
          background: 'from-slate-900 via-purple-900 to-slate-900',
          accent: 'purple'
        };
    }
  };

  const theme = getThemeColors();
const renderPage = () => {
  switch (currentPage) {
    case 'main':
      return <MainContent userType={userType} theme={theme} initialResponse={selectedResponse} />;
    case 'how-it-works':
      return <HowItWorks theme={theme} />;
    case 'about':
      return <AboutTeam theme={theme} />;
    case 'data-gallery': // 👈 NEW PAGE
      return <DataGallery userType={userType} theme={theme} user={user} />;
    default:
      return <MainContent userType={userType} theme={theme} initialResponse={selectedResponse} />;
  }
};


  return (
    <div className={`min-h-screen relative overflow-hidden`}>
      {/* 🌌 Star Background Layer */}
      <div className="fixed inset-0 -z-10">
        <StarBackground />
      </div>

      {/* Optional floating motion dots you already had */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 bg-${theme.accent}-400 rounded-full opacity-30`}
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 15 + 10,
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

      {/* Main layout */}
      <div className="flex h-screen relative z-10">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0"
            >
              <Sidebar
                user={user}
                userType={userType}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onUserTypeChange={onUserTypeChange}
                onSignOut={onSignOut}
                theme={theme}
                onToggle={() => setSidebarOpen(false)}
                onSelectHistory={(resp) => {
                  setSelectedResponse(resp);
                  setCurrentPage('main');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col">
          {!sidebarOpen && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSidebarOpen(true)}
              className={`fixed top-4 left-4 z-20 p-2 bg-gradient-to-r ${theme.primary} rounded-lg text-white hover:scale-105 transition-transform`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          )}

          <main className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
