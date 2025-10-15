"use client";

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { ChatMessage, Badge } from '@/types';
import CodeEditor from './CodeEditor';
import ChatInterface from './ChatInterface';
import BadgesDisplay from './BadgesDisplay';
import DemoModeToggle from './DemoModeToggle';
import CompactDemoToggle from './CompactDemoToggle';
import Navigation, { NavigationTab } from './Navigation';
import { getCodeFeedbackAction, sendChatMessageAction, awardSkillBadgeAction, getUserBadges, getDemoMode, setDemoMode as setDemoModeAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface KiroAppProps {
  user: User;
}

const KiroApp: React.FC<KiroAppProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('code-mentor');
  const [codeContent, setCodeContent] = useState<string>('// Welcome to KiroVerse!\n// Write your code here and get AI feedback\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10));');
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState({
    feedback: false,
    chat: false,
    badges: false
  });
  const [isCodeEditorExpanded, setIsCodeEditorExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(prev => ({ ...prev, badges: true }));
      const [badges, currentDemoMode] = await Promise.all([
        getUserBadges(user.uid),
        getDemoMode(user.uid)
      ]);
      setUserBadges(badges);
      setDemoMode(currentDemoMode);
      setIsLoading(prev => ({ ...prev, badges: false }));
    };
    fetchInitialData();
  }, [user.uid]);

  const handleGetCodeFeedback = async () => {
    setIsLoading(prev => ({ ...prev, feedback: true }));
    setAiFeedback('');
    const feedback = await getCodeFeedbackAction(codeContent);
    setAiFeedback(feedback);
    setIsLoading(prev => ({ ...prev, feedback: false }));
  };

  const handleSendChatMessage = async (query: string) => {
    setIsLoading(prev => ({ ...prev, chat: true }));
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: query }];
    setChatMessages(newMessages);

    try {
      const result = await sendChatMessageAction(codeContent, query);
      const aiResponse = result?.aiResponse || "Sorry, I couldn't generate a response right now. Please try again.";
      setChatMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble responding right now. The AI service might be temporarily unavailable. Please try again later." }]);
    }
    setIsLoading(prev => ({ ...prev, chat: false }));
  };

  const handleAwardBadge = async () => {
    setIsLoading(prev => ({ ...prev, badges: true }));
    const result = await awardSkillBadgeAction(user.uid, codeContent, demoMode);
    if (result.success && result.badge) {
      setUserBadges(prev => [result.badge!, ...prev]);
      toast({
        title: 'Badge Awarded!',
        description: demoMode 
          ? `Demo badge "${result.badge!.name}" created successfully!`
          : `NFT badge "${result.badge!.name}" minted on blockchain!`,
      });
    } else {
      toast({
        title: 'Badge Award Failed',
        description: result.error || 'Failed to award badge',
        variant: 'destructive',
      });
    }
    setIsLoading(prev => ({ ...prev, badges: false }));
  };

  const handleDemoModeToggle = async (newDemoMode: boolean) => {
    await setDemoModeAction(user.uid, newDemoMode);
    setDemoMode(newDemoMode);
    toast({
      title: 'Demo Mode Updated',
      description: newDemoMode 
        ? 'Switched to demo mode - badges will be mocked'
        : 'Switched to production mode - badges will be minted as NFTs',
    });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'code-mentor':
        return (
          <div className={`mx-auto p-8 transition-all duration-300 ${isCodeEditorExpanded ? 'max-w-none' : 'max-w-7xl'}`}>
            {isCodeEditorExpanded ? (
              // Expanded layout - Code editor takes full width
              <div className="space-y-6">
                <div className="animate-slide-in-left">
                  <CodeEditor
                    code={codeContent}
                    onCodeChange={setCodeContent}
                    onGetFeedback={handleGetCodeFeedback}
                    aiFeedback={aiFeedback}
                    isLoading={isLoading.feedback}
                    isExpanded={isCodeEditorExpanded}
                    onToggleExpand={() => setIsCodeEditorExpanded(!isCodeEditorExpanded)}
                  />
                </div>
                
                {/* Collapsed sidebar in expanded mode */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <ChatInterface
                      messages={chatMessages}
                      onSendMessage={handleSendChatMessage}
                      isLoading={isLoading.chat}
                    />
                  </div>
                  <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <BadgesDisplay
                      badges={userBadges}
                      onAwardBadge={handleAwardBadge}
                      isLoading={isLoading.badges}
                    />
                  </div>
                  <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-blue-200/50 dark:border-slate-600 p-6 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                          <span className="text-white text-lg">⚙️</span>
                        </div>
                        <h3 className="text-xl font-semibold">Badge Settings</h3>
                      </div>
                      <DemoModeToggle
                        demoMode={demoMode}
                        onToggle={handleDemoModeToggle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Normal layout - Side by side
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-7 space-y-6">
                  <div className="animate-slide-in-left">
                    <CodeEditor
                      code={codeContent}
                      onCodeChange={setCodeContent}
                      onGetFeedback={handleGetCodeFeedback}
                      aiFeedback={aiFeedback}
                      isLoading={isLoading.feedback}
                      isExpanded={isCodeEditorExpanded}
                      onToggleExpand={() => setIsCodeEditorExpanded(!isCodeEditorExpanded)}
                    />
                  </div>
                  
                  {/* Demo Mode Settings */}
                  <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-blue-200/50 dark:border-slate-600 p-6 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                          <span className="text-white text-lg">⚙️</span>
                        </div>
                        <h3 className="text-xl font-semibold">Badge Minting Settings</h3>
                      </div>
                      <DemoModeToggle
                        demoMode={demoMode}
                        onToggle={handleDemoModeToggle}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="xl:col-span-5 animate-slide-in-right">
                   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-6 h-full">
                      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <ChatInterface
                        messages={chatMessages}
                        onSendMessage={handleSendChatMessage}
                        isLoading={isLoading.chat}
                        />
                      </div>
                      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <BadgesDisplay
                        badges={userBadges}
                        onAwardBadge={handleAwardBadge}
                        isLoading={isLoading.badges}
                        />
                      </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'analytics':
        return (
          <div className="max-w-7xl mx-auto p-8">
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Analytics Dashboard
                  </h1>
                  <p className="text-muted-foreground">Track your coding journey and skill development</p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Skill Progress Overview */}
              <div className="xl:col-span-2 bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-blue-200/50 dark:border-slate-600 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <span className="text-white text-lg">📈</span>
                  </div>
                  <h3 className="text-xl font-semibold">Skill Progress</h3>
                </div>
                <div className="space-y-6">
                  {[
                    { skill: 'JavaScript', level: 7, progress: 75, color: 'from-blue-500 to-blue-600', icon: '🟨' },
                    { skill: 'TypeScript', level: 5, progress: 50, color: 'from-blue-600 to-indigo-600', icon: '🔷' },
                    { skill: 'React', level: 6, progress: 67, color: 'from-cyan-500 to-blue-500', icon: '⚛️' },
                    { skill: 'Node.js', level: 4, progress: 40, color: 'from-green-500 to-emerald-500', icon: '🟢' }
                  ].map((item, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span>
                          <span className="font-medium">{item.skill}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold bg-gradient-to-r {item.color} bg-clip-text text-transparent">
                            Level {item.level}
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full h-3 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out group-hover:scale-105`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <div className="absolute right-0 -top-6 text-xs text-muted-foreground">
                          {item.progress}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Overview */}
              <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-purple-200/50 dark:border-slate-600 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold">Your Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: userBadges.length, label: 'Badges Earned', color: 'from-blue-500 to-cyan-500', icon: '🏆' },
                    { value: 47, label: 'Code Reviews', color: 'from-green-500 to-emerald-500', icon: '👥' },
                    { value: 156, label: 'AI Interactions', color: 'from-purple-500 to-pink-500', icon: '🤖' },
                    { value: 23, label: 'Days Active', color: 'from-orange-500 to-red-500', icon: '🔥' }
                  ].map((stat, index) => (
                    <div key={index} className="group p-4 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/20 dark:border-slate-600/20 hover:scale-105 transition-transform">
                      <div className="text-center">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                          {stat.value}
                        </div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gradient-to-br from-white to-green-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-green-200/50 dark:border-slate-600 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold">Recent Activity</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { action: 'Earned "Algorithm Master" badge', time: '2h ago', color: 'bg-green-500', icon: '🏆' },
                    { action: 'Completed code review session', time: '5h ago', color: 'bg-blue-500', icon: '👥' },
                    { action: 'Submitted 3 code analyses', time: '1d ago', color: 'bg-purple-500', icon: '📝' },
                    { action: 'Joined peer review discussion', time: '2d ago', color: 'bg-orange-500', icon: '💬' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-white/20 dark:border-slate-600/20 hover:bg-white/80 dark:hover:bg-slate-600/50 transition-colors">
                      <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center text-white text-sm flex-shrink-0`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Insights */}
              <div className="bg-gradient-to-br from-white to-amber-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-amber-200/50 dark:border-slate-600 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                    <span className="text-white text-lg">💡</span>
                  </div>
                  <h3 className="text-xl font-semibold">Learning Insights</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-xl border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">⭐</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Strength Identified</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">You excel at async/await patterns</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-xl border-l-4 border-amber-500">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">🎯</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Improvement Area</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">Consider practicing error handling</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-xl border-l-4 border-purple-500">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">🚀</span>
                      <div>
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">Recommendation</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">Try advanced React patterns</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="max-w-7xl mx-auto p-8">
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Leaderboard
                  </h1>
                  <p className="text-muted-foreground">Global rankings and competitions</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Top Performers */}
              <div className="lg:col-span-2 bg-gradient-to-br from-white to-yellow-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-yellow-200/50 dark:border-slate-600 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                    <span className="text-white text-lg">🥇</span>
                  </div>
                  <h3 className="text-xl font-semibold">Top Performers This Week</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { rank: 1, name: "Alex Chen", badges: 47, points: 2840, avatar: "🧑‍💻", trend: "+12" },
                    { rank: 2, name: "Sarah Kim", badges: 42, points: 2650, avatar: "👩‍💻", trend: "+8" },
                    { rank: 3, name: "Mike Johnson", badges: 38, points: 2420, avatar: "👨‍💻", trend: "+5" },
                    { rank: 4, name: "You", badges: userBadges.length, points: userBadges.length * 50, avatar: "🚀", trend: "+3" },
                    { rank: 5, name: "Emma Davis", badges: 35, points: 2180, avatar: "👩‍💻", trend: "+2" }
                  ].map((user, index) => (
                    <div key={index} className={`group relative overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02] ${
                      user.name === 'You' 
                        ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border-2 border-blue-500/30 shadow-lg' 
                        : 'bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/20 hover:bg-white/80 dark:hover:bg-slate-600/50'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                            user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                            user.rank === 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                            'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
                          }`}>
                            {user.rank}
                          </div>
                          <div className="text-3xl">{user.avatar}</div>
                          <div>
                            <div className="font-semibold text-lg">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>{user.badges} badges</span>
                              <span>•</span>
                              <span>{user.points} points</span>
                              <span className="text-green-600 font-medium">({user.trend})</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          {user.rank <= 3 && (
                            <div className="text-2xl">
                              {user.rank === 1 && <span>🥇</span>}
                              {user.rank === 2 && <span>🥈</span>}
                              {user.rank === 3 && <span>🥉</span>}
                            </div>
                          )}
                          {user.name === 'You' && (
                            <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded-full">
                              YOU
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Your Rank */}
                <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-blue-200/50 dark:border-slate-600 p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                      <span className="text-white text-lg">🎯</span>
                    </div>
                    <h3 className="text-xl font-semibold">Your Rank</h3>
                  </div>
                  <div className="text-center">
                    <div className="relative mb-4">
                      <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        #{Math.max(4, Math.floor(Math.random() * 50))}
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">Global Ranking</div>
                    <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-full border border-green-200/50 dark:border-green-800/50">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {userBadges.length > 10 ? "🔥 On fire!" : "Keep coding to climb higher!"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Challenges */}
                <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-purple-200/50 dark:border-slate-600 p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <span className="text-white text-lg">⚡</span>
                    </div>
                    <h3 className="text-xl font-semibold">Active Challenges</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Algorithm Sprint", timeLeft: "2 days", participants: 127, color: "from-blue-500 to-purple-500", icon: "🏃‍♂️" },
                      { name: "Code Golf Challenge", timeLeft: "5 days", participants: 89, color: "from-green-500 to-blue-500", icon: "⛳" },
                      { name: "Debug Master", timeLeft: "1 week", participants: 156, color: "from-red-500 to-pink-500", icon: "🐛" }
                    ].map((challenge, index) => (
                      <div key={index} className="group p-4 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/20 dark:border-slate-600/20 hover:bg-white/80 dark:hover:bg-slate-600/50 transition-all hover:scale-105">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 bg-gradient-to-r ${challenge.color} rounded-lg`}>
                            <span className="text-white text-sm">{challenge.icon}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{challenge.name}</div>
                            <div className="text-xs text-muted-foreground">Ends in {challenge.timeLeft}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {challenge.participants} participants
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-orange-200/50 dark:border-slate-600 p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                      <span className="text-white text-lg">📈</span>
                    </div>
                    <h3 className="text-xl font-semibold">This Week</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Rank Change", value: "+3", color: "text-green-600", icon: "📈" },
                      { label: "Points Earned", value: "150", color: "text-blue-600", icon: "⭐" },
                      { label: "Challenges Won", value: "2", color: "text-purple-600", icon: "🏆" }
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-white/20 dark:border-slate-600/20">
                        <div className="flex items-center gap-2">
                          <span>{stat.icon}</span>
                          <span className="text-sm">{stat.label}</span>
                        </div>
                        <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'peer-review':
        return (
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">👥 Peer Review</h1>
              <p className="text-muted-foreground">Community code reviews and mentorship</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Review Requests */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">📝 Recent Review Requests</h3>
                  <div className="space-y-4">
                    {[
                      { title: "React Hook Optimization", author: "Sarah K.", language: "TypeScript", time: "2h ago", difficulty: "Intermediate" },
                      { title: "Algorithm Implementation", author: "Mike J.", language: "Python", time: "4h ago", difficulty: "Advanced" },
                      { title: "API Error Handling", author: "Emma D.", language: "JavaScript", time: "6h ago", difficulty: "Beginner" }
                    ].map((request, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{request.title}</h4>
                            <p className="text-sm text-muted-foreground">by {request.author} • {request.time}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{request.language}</span>
                              <span className="text-xs bg-muted px-2 py-1 rounded">{request.difficulty}</span>
                            </div>
                          </div>
                          <button className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90">
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">🎯 Your Reviews</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div>
                        <div className="font-medium text-sm">Database Query Optimization</div>
                        <div className="text-xs text-muted-foreground">Reviewed 1 day ago</div>
                      </div>
                      <div className="text-green-600 text-sm">✅ Approved</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div>
                        <div className="font-medium text-sm">React Component Refactor</div>
                        <div className="text-xs text-muted-foreground">Reviewed 2 days ago</div>
                      </div>
                      <div className="text-blue-600 text-sm">💬 Feedback Given</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Stats */}
              <div className="space-y-6">
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Your Impact</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">23</div>
                      <div className="text-sm text-muted-foreground">Reviews Given</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">8</div>
                      <div className="text-sm text-muted-foreground">Reviews Received</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">4.8</div>
                      <div className="text-sm text-muted-foreground">Average Rating</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">🌟 Top Reviewers</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Alex Chen", reviews: 156, rating: 4.9 },
                      { name: "Sarah Kim", reviews: 142, rating: 4.8 },
                      { name: "Mike Johnson", reviews: 128, rating: 4.7 }
                    ].map((reviewer, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-lg">👨‍💻</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{reviewer.name}</div>
                          <div className="text-xs text-muted-foreground">{reviewer.reviews} reviews • ⭐ {reviewer.rating}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-2">🚀 Request Review</h3>
                  <p className="text-sm text-muted-foreground mb-4">Get feedback on your code from the community</p>
                  <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
                    Submit Code for Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'github':
        return (
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">🔗 GitHub Integration</h1>
              <p className="text-muted-foreground">Repository analysis and automatic skill recognition</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Connection Status */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">🔗 Connection Status</h3>
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
                      Connect GitHub
                    </button>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="text-4xl mb-2">🔌</div>
                    <p className="font-medium">Connect your GitHub account</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Automatically analyze your repositories and earn skill badges
                    </p>
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Repository Analysis Preview</h3>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">my-awesome-project</h4>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Public</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">A full-stack web application built with React and Node.js</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">TypeScript</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">React</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Node.js</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        🏆 Potential badges: "Full-Stack Developer", "TypeScript Expert", "React Specialist"
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">algorithm-challenges</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Private</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Collection of algorithm solutions and data structures</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Python</span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Java</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        🏆 Potential badges: "Algorithm Master", "Problem Solver", "Multi-Language Developer"
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Features */}
              <div className="space-y-6">
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">📈 GitHub Stats</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">12</div>
                      <div className="text-sm text-muted-foreground">Repositories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">247</div>
                      <div className="text-sm text-muted-foreground">Commits This Year</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">8</div>
                      <div className="text-sm text-muted-foreground">Languages Used</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">🎯 Skill Detection</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">JavaScript</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Expert</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">React</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Advanced</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Node.js</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Intermediate</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Python</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Beginner</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-2">🚀 Auto-Badge System</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect GitHub to automatically earn badges based on your code contributions
                  </p>
                  <div className="text-xs text-muted-foreground">
                    ✅ Repository analysis<br/>
                    ✅ Language detection<br/>
                    ✅ Skill assessment<br/>
                    ✅ Automatic badge minting
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'employer':
        return (
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">🏢 Employer Tools</h1>
              <p className="text-muted-foreground">Credential verification and developer assessments</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Credential Verification */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">🔍 Credential Verification</h3>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-bold">JD</span>
                        </div>
                        <div>
                          <h4 className="font-medium">John Developer</h4>
                          <p className="text-sm text-muted-foreground">john.dev@email.com</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm font-medium">Verified Badges</div>
                          <div className="text-2xl font-bold text-green-600">12</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Skill Level</div>
                          <div className="text-2xl font-bold text-blue-600">Senior</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ JavaScript Expert</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">✅ React Specialist</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">✅ Full-Stack</span>
                      </div>
                      <button className="w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90">
                        View Full Blockchain Verification
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">📝 Assessment Creator</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Assessment Type</label>
                        <select className="w-full mt-1 p-2 border rounded">
                          <option>Coding Challenge</option>
                          <option>Algorithm Test</option>
                          <option>System Design</option>
                          <option>Code Review</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Difficulty</label>
                        <select className="w-full mt-1 p-2 border rounded">
                          <option>Junior</option>
                          <option>Mid-Level</option>
                          <option>Senior</option>
                          <option>Expert</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Required Skills</label>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded cursor-pointer">JavaScript</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded cursor-pointer">React</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded cursor-pointer">Node.js</span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded cursor-pointer">+ Add</span>
                      </div>
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                      Generate AI Assessment
                    </button>
                  </div>
                </div>
              </div>

              {/* Tools & Stats */}
              <div className="space-y-6">
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Hiring Insights</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">156</div>
                      <div className="text-sm text-muted-foreground">Candidates Verified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <div className="text-sm text-muted-foreground">Verification Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">23</div>
                      <div className="text-sm text-muted-foreground">Assessments Created</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">🎯 Top Skills Verified</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">JavaScript</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">47 verified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">React</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">34 verified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Python</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">28 verified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Node.js</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">22 verified</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-2">🔐 Blockchain Trust</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    All credentials are verified on the blockchain and cannot be faked
                  </p>
                  <div className="text-xs text-muted-foreground">
                    ✅ Immutable records<br/>
                    ✅ Cryptographic proof<br/>
                    ✅ Real-time verification<br/>
                    ✅ Zero fraud risk
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Enhanced Header with Glass Effect */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">K</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-xl blur opacity-30 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                    KiroVerse
                  </h1>
                  <p className="text-xs text-muted-foreground">AI-Powered Learning Platform</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">
                  Welcome back, {user.displayName?.split(' ')[0] || 'Developer'}!
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CompactDemoToggle
                demoMode={demoMode}
                onToggle={handleDemoModeToggle}
              />
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-full border border-green-200/50 dark:border-green-800/50">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {userBadges.length} Badges
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* Enhanced Navigation */}
          <div className="relative">
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl -z-10"></div>
          </div>

          {/* Main Content with Enhanced Container */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-blue-50/30 to-purple-50/20 dark:from-slate-800/50 dark:via-slate-700/30 dark:to-slate-600/20 rounded-3xl -z-10"></div>
            <div className="relative backdrop-blur-sm">
              {renderActiveTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KiroApp;