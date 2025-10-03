import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Home,
  History,
  HelpCircle,
  Users,
  LogOut,
  X,
  Brain,
  TrendingUp,
  Map,
  Rocket,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { useHistoryManager } from '../auth/context/historyManager';

export function Sidebar({
  user,
  userType,
  currentPage,
  onPageChange,
  onUserTypeChange,
  onSignOut,
  theme,
  onToggle,
  onSelectHistory
}) {
  const { getHistory, session, loading } = useHistoryManager();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch / toggle chat history dropdown
  const handleHistoryClick = async () => {
    if (loading) {
      console.log('History fetch skipped: auth loading');
      return;
    }

    // If no authenticated user, just toggle open so user sees the message
    if (!session?.user?.id) {
      console.warn('No user session found. Please sign in.');
      setHistoryOpen((p) => !p);
      return;
    }

    // If already open, close it
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }

    // Otherwise fetch history and open
    try {
      setHistoryLoading(true);
      const result = await getHistory();
      if (result?.success) {
        const rows = Array.isArray(result.data) ? result.data : [];
        const sessions = rows.map((r) => ({
          query: r.query || '',
          response: r.response || ''
        }));
        setHistorySessions(sessions);
      } else {
        console.error('Failed to get history:', result?.error || 'Unknown error');
        setHistorySessions([]);
      }
    } catch (err) {
      console.error('Error getting history:', err);
      setHistorySessions([]);
    } finally {
      setHistoryLoading(false);
      setHistoryOpen(true);
    }
  };

  const getUserTypeIcon = () => {
    switch (userType) {
      case 'scientist':
        return Brain;
      case 'investor':
        return TrendingUp;
      case 'mission-architect':
        return Map;
      default:
        return Rocket;
    }
  };

  const getUserTypeColor = () => {
    switch (userType) {
      case 'scientist':
        return 'bg-blue-500';
      case 'investor':
        return 'bg-green-500';
      case 'mission-architect':
        return 'bg-amber-400';
      default:
        return 'bg-purple-500';
    }
  };

  const UserTypeIcon = getUserTypeIcon();

  // NOTE: use id 'data-gallery' so it matches Dashboard's renderPage case
  const topMenuItems = [
    { id: 'main', label: 'New Chat with Astro', icon: Home },
    { id: 'data-gallery', label: 'Data Library', icon: BookOpen }, // <-- id changed
    { id: 'chat-history', label: 'Chat History', icon: History }
  ];

  const bottomMenuItems = [
    { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
    { id: 'about', label: 'Our Team', icon: Users }
  ];

  const userTypeOptions = [
    { id: 'scientist', label: 'Scientist', icon: Brain },
    { id: 'investor', label: 'Manager/Investor', icon: TrendingUp },
    { id: 'mission-architect', label: 'Mission Architect', icon: Map }
  ];

  const handleNewChatClick = () => {
    if (onPageChange) onPageChange('main');
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  };

  return (
    <motion.div
      className="w-80 h-full bg-black/20 backdrop-blur-sm border-r border-white/10 flex flex-col relative z-50"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className={`w-10 h-10 bg-gradient-to-r ${theme?.primary} rounded-full flex items-center justify-center`}
            >
              <Rocket className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-white font-semibold">AstroNots</h2>
              <p className="text-gray-400 text-sm">Space Research AI</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
          <Avatar className="w-10 h-10">
            <AvatarFallback className={`${getUserTypeColor()} text-white`}>
              {user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.user_metadata?.name || user?.email}
            </p>
            <div className="flex items-center gap-2">
              <UserTypeIcon className="w-3 h-3 text-gray-400" />
              <p className="text-gray-400 text-xs capitalize">{userType.replace('-', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {topMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          const handleClick = () => {
            if (item.id === 'main') {
              handleNewChatClick();
            } else if (item.id === 'chat-history') {
              handleHistoryClick();
            } else {
              if (onPageChange) onPageChange(item.id);
            }
          };

          return (
            <div key={item.id}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  onClick={handleClick}
                  className={`w-full justify-start gap-3 h-12 transition-all ${
                    isActive ? `bg-gradient-to-r ${theme?.primary} text-white shadow-lg` : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-expanded={item.id === 'chat-history' ? historyOpen : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>

                  {/* show chevron only for history */}
                  {item.id === 'chat-history' && (
                    <ChevronDown
                      className={`w-4 h-4 ml-auto transition-transform duration-200 ${historyOpen ? 'rotate-180' : 'rotate-0'} text-gray-400`}
                      aria-hidden
                    />
                  )}
                </Button>
              </motion.div>

              {/* Chat history dropdown with animation */}
              {item.id === 'chat-history' && (
                <AnimatePresence>
                  {historyOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="mt-2 overflow-hidden"
                    >
                      <div className="max-h-64 overflow-auto space-y-2 p-2 bg-white/5 rounded border border-white/10">
                        {historyLoading ? (
                          <div className="text-gray-300 text-sm p-2">Loading history…</div>
                        ) : historySessions.length === 0 ? (
                          <div className="text-gray-400 text-sm p-2">No chat history found.</div>
                        ) : (
                          historySessions.map((session, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              type="button"
                              onClick={() => {
                                // Convert response to plain text (same logic you had)
                                let text = '';
                                const resp = session.response;
                                if (typeof resp === 'string') {
                                  text = resp;
                                } else if (Array.isArray(resp)) {
                                  text = resp
                                    .map((r) => (r && typeof r === 'object' && 'text' in r ? r.text : JSON.stringify(r)))
                                    .join('\n\n');
                                } else if (resp && typeof resp === 'object') {
                                  if (Array.isArray(resp.paragraphs)) {
                                    text = resp.paragraphs.map((p: any) => (typeof p?.text === 'string' ? p.text : JSON.stringify(p))).join('\n\n');
                                  } else {
                                    text = JSON.stringify(resp);
                                  }
                                } else {
                                  text = String(resp ?? '');
                                }

                                const responseData = {
                                  paragraphs: [{ title: '', text, images: [], tables: [] }],
                                  metadata: {
                                    total_paragraphs: 1,
                                    total_images: [],
                                    total_tables: [],
                                    source_documents: 0,
                                    user_type: userType,
                                    query: session.query // <-- ensure query is stored for display
                                  },
                                  userType: userType,
                                  overallTitle: ''
                                };

                                if (onSelectHistory) {
                                  onSelectHistory(responseData);
                                }

                                // close dropdown and navigate back to chat
                                setHistoryOpen(false);
                                if (onPageChange) onPageChange('main');
                              }}
                              className="w-full justify-start text-sm text-gray-300 hover:text-white hover:bg-white/10 truncate"
                              title={session.query}
                            >
                              {String(session.query || '').slice(0, 50)}
                              {String(session.query || '').length > 50 ? '…' : ''}
                            </Button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}

        {/* User Type selector */}
        <div className="pt-4 border-t border-white/10 mt-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 px-3">User Type</p>
          <div className="space-y-1">
            {userTypeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = userType === option.id;
              return (
                <motion.div key={option.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    onClick={() => onUserTypeChange(option.id)}
                    className={`w-full justify-start gap-3 h-10 text-sm transition-all ${
                      isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.div key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  onClick={() => onPageChange(item.id)}
                  className={`w-full justify-start gap-3 h-12 transition-all ${
                    isActive ? `bg-gradient-to-r ${theme?.primary} text-white shadow-lg` : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
}
