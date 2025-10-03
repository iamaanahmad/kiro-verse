"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { 
  Code, 
  BarChart3, 
  Trophy, 
  Users, 
  GitBranch, 
  Building, 
  Settings,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export type NavigationTab = 
  | 'code-mentor' 
  | 'analytics' 
  | 'leaderboard' 
  | 'peer-review' 
  | 'github' 
  | 'employer';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'code-mentor' as NavigationTab,
      label: 'Code Mentor',
      icon: Code,
      description: 'AI-powered code feedback and chat',
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '🤖'
    },
    {
      id: 'analytics' as NavigationTab,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Learning progress and insights',
      gradient: 'from-purple-500 to-pink-500',
      emoji: '📊'
    },
    {
      id: 'leaderboard' as NavigationTab,
      label: 'Leaderboard',
      icon: Trophy,
      description: 'Rankings and competitions',
      gradient: 'from-yellow-500 to-orange-500',
      emoji: '🏆'
    },
    {
      id: 'peer-review' as NavigationTab,
      label: 'Peer Review',
      icon: Users,
      description: 'Community code reviews',
      gradient: 'from-green-500 to-emerald-500',
      emoji: '👥'
    },
    {
      id: 'github' as NavigationTab,
      label: 'GitHub',
      icon: GitBranch,
      description: 'Repository integration',
      gradient: 'from-gray-600 to-gray-800',
      emoji: '🔗'
    },
    {
      id: 'employer' as NavigationTab,
      label: 'Employer',
      icon: Building,
      description: 'Verification tools',
      gradient: 'from-indigo-500 to-purple-600',
      emoji: '🏢'
    }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={`group relative flex items-center gap-3 px-4 py-3 h-auto transition-all duration-300 rounded-xl overflow-hidden ${
                isActive 
                  ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-105` 
                  : 'hover:bg-white/80 dark:hover:bg-slate-700/80 hover:scale-105'
              }`}
              title={item.description}
            >
              {/* Background glow for active tab */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-20 blur-xl`}></div>
              )}
              
              <div className="relative flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-600 dark:to-slate-700'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="hidden lg:flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xs opacity-80">{item.emoji}</span>
                  </div>
                  <span className="text-xs opacity-70 max-w-32 truncate">{item.description}</span>
                </div>
                <div className="lg:hidden">
                  <span className="text-lg">{item.emoji}</span>
                </div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/50 rounded-full"></div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/20 dark:border-slate-700/50"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span>Menu</span>
        </Button>

        {isMobileMenuOpen && (
          <div className="absolute top-16 left-4 right-4 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`group relative flex flex-col items-center gap-2 h-auto py-4 transition-all duration-300 rounded-xl overflow-hidden ${
                      isActive 
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                        : 'hover:bg-white/80 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    {/* Background glow for active tab */}
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-20 blur-xl`}></div>
                    )}
                    
                    <div className="relative flex flex-col items-center gap-2">
                      <div className={`p-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-white/20' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-600 dark:to-slate-700'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">{item.label}</span>
                          <span className="text-xs">{item.emoji}</span>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}