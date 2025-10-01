import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  Home, 
  History, 
  Settings, 
  HelpCircle, 
  Users, 
  LogOut, 
  X,
  Brain,
  TrendingUp,
  Map,
  Rocket
} from 'lucide-react';

export function Sidebar({ 
  user, 
  userType, 
  currentPage, 
  onPageChange, 
  onUserTypeChange, 
  onSignOut, 
  theme,
  onToggle 
}) {
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

  const menuItems = [
    { id: 'main', label: 'AI Agent', icon: Home },
    { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
    { id: 'about', label: 'About Team', icon: Users },
  ];

  const userTypeOptions = [
    { id: 'scientist', label: 'Scientist', icon: Brain },
    { id: 'investor', label: 'Manager/Investor', icon: TrendingUp },
    { id: 'mission-architect', label: 'Mission Architect', icon: Map }
  ];
  
  return (
    <motion.div 
      className="w-80 h-full bg-black/20 backdrop-blur-sm border-r border-white/10 flex flex-col"
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
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={`w-10 h-10 bg-gradient-to-r ${theme.primary} rounded-full flex items-center justify-center`}
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
              <p className="text-gray-400 text-xs capitalize">
                {userType.replace('-', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                onClick={() => onPageChange(item.id)}
                className={`w-full justify-start gap-3 h-12 transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${theme.primary} text-white shadow-lg` 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            </motion.div>
          );
        })}

        <div className="pt-4 border-t border-white/10 mt-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 px-3">
            User Type
          </p>
          <div className="space-y-1">
            {userTypeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = userType === option.id;
              
              return (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => onUserTypeChange(option.id)}
                    className={`w-full justify-start gap-3 h-10 text-sm transition-all ${
                      isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
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
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/10"
        >
          <History className="w-5 h-5" />
          History
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/10"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Button>
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