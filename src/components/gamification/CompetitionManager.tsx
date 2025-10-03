/**
 * @fileOverview Competition management component for creating and managing competitions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  Award, 
  Target, 
  Settings,
  Play,
  Pause,
  Square,
  Eye
} from 'lucide-react';
import { LeaderboardService } from '@/lib/gamification/leaderboard-service';
import { Competition, CompetitionPrize, CompetitionRule } from '@/types/gamification';

interface CompetitionManagerProps {
  userId: string;
  userRole: 'admin' | 'moderator' | 'user';
}

export function CompetitionManager({ userId, userRole }: CompetitionManagerProps) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Form state for creating competitions
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily' as Competition['type'],
    category: 'skill_based' as Competition['category'],
    startDate: '',
    endDate: '',
    maxParticipants: '',
    entryFee: '',
    registrationDeadline: ''
  });

  const [prizes, setPrizes] = useState<CompetitionPrize[]>([]);
  const [rules, setRules] = useState<CompetitionRule[]>([]);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      // This would fetch from the service
      const mockCompetitions: Competition[] = [
        {
          competitionId: 'comp_1',
          title: 'Daily JavaScript Challenge',
          description: 'Test your JavaScript skills with daily challenges',
          type: 'daily',
          category: 'skill_based',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          prizes: [
            { rank: 1, title: 'Gold Badge', description: 'First place winner', type: 'badge', value: 'gold_js_master' },
            { rank: 2, title: 'Silver Badge', description: 'Second place', type: 'badge', value: 'silver_js_expert' },
            { rank: 3, title: 'Bronze Badge', description: 'Third place', type: 'badge', value: 'bronze_js_skilled' }
          ],
          rules: [
            { ruleId: 'rule_1', description: 'No external libraries allowed', category: 'submission', isRequired: true },
            { ruleId: 'rule_2', description: 'Code must be original work', category: 'conduct', isRequired: true }
          ],
          participants: [],
          leaderboard: [],
          status: 'active',
          createdBy: 'system',
          metadata: {
            totalParticipants: 45,
            averageScore: 72,
            topScore: 95,
            submissionsCount: 67,
            skillsTargeted: ['JavaScript', 'algorithms'],
            difficultyLevel: 'intermediate',
            estimatedDuration: 60
          }
        },
        {
          competitionId: 'comp_2',
          title: 'Weekly React Mastery',
          description: 'Build amazing React components and win prizes',
          type: 'weekly',
          category: 'skill_based',
          startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          prizes: [
            { rank: 1, title: 'React Master NFT', description: 'Exclusive NFT badge', type: 'nft', value: 'react_master_nft' },
            { rank: 'top_10', title: 'Bonus Points', description: 'Extra 500 points', type: 'points', value: 500 }
          ],
          rules: [
            { ruleId: 'rule_3', description: 'Must use React 18+ features', category: 'submission', isRequired: true },
            { ruleId: 'rule_4', description: 'Component must be accessible', category: 'submission', isRequired: true }
          ],
          participants: [],
          leaderboard: [],
          status: 'active',
          createdBy: userId,
          metadata: {
            totalParticipants: 128,
            averageScore: 78,
            topScore: 98,
            submissionsCount: 156,
            skillsTargeted: ['React', 'TypeScript', 'accessibility'],
            difficultyLevel: 'advanced',
            estimatedDuration: 180
          }
        }
      ];
      setCompetitions(mockCompetitions);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompetition = async () => {
    try {
      const competitionData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        entryFee: formData.entryFee ? parseInt(formData.entryFee) : undefined,
        challenges: [], // Would be selected from available challenges
        prizes,
        rules,
        createdBy: userId
      };

      const newCompetition = await LeaderboardService.createCompetition(competitionData);
      setCompetitions(prev => [...prev, newCompetition]);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating competition:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'daily',
      category: 'skill_based',
      startDate: '',
      endDate: '',
      maxParticipants: '',
      entryFee: '',
      registrationDeadline: ''
    });
    setPrizes([]);
    setRules([]);
  };

  const addPrize = () => {
    setPrizes(prev => [...prev, {
      rank: 1,
      title: '',
      description: '',
      type: 'points',
      value: 0
    }]);
  };

  const addRule = () => {
    setRules(prev => [...prev, {
      ruleId: `rule_${Date.now()}`,
      description: '',
      category: 'submission',
      isRequired: true
    }]);
  };

  const getStatusBadge = (status: Competition['status']) => {
    const variants = {
      upcoming: 'secondary',
      registration_open: 'default',
      active: 'default',
      completed: 'secondary',
      cancelled: 'destructive'
    } as const;

    const colors = {
      upcoming: 'text-blue-600',
      registration_open: 'text-green-600',
      active: 'text-green-600',
      completed: 'text-gray-600',
      cancelled: 'text-red-600'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredCompetitions = competitions.filter(comp => {
    switch (activeTab) {
      case 'active':
        return comp.status === 'active' || comp.status === 'registration_open';
      case 'upcoming':
        return comp.status === 'upcoming';
      case 'completed':
        return comp.status === 'completed';
      case 'my_competitions':
        return comp.createdBy === userId;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading competitions...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3 mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Competition Manager</h2>
          <p className="text-muted-foreground">Manage and participate in coding competitions</p>
        </div>
        
        {(userRole === 'admin' || userRole === 'moderator') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Competition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Competition</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Competition title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Competition description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="special">Special</SelectItem>
                          <SelectItem value="seasonal">Seasonal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skill_based">Skill Based</SelectItem>
                          <SelectItem value="challenge_based">Challenge Based</SelectItem>
                          <SelectItem value="community_based">Community Based</SelectItem>
                          <SelectItem value="innovation">Innovation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Prizes */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Prizes</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPrize}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Prize
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {prizes.map((prize, index) => (
                      <div key={index} className="flex gap-2 items-center p-2 border rounded">
                        <Input
                          placeholder="Rank (1, 2, 3, or 'top_10')"
                          value={prize.rank}
                          onChange={(e) => {
                            const newPrizes = [...prizes];
                            newPrizes[index].rank = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                            setPrizes(newPrizes);
                          }}
                          className="w-32"
                        />
                        <Input
                          placeholder="Prize title"
                          value={prize.title}
                          onChange={(e) => {
                            const newPrizes = [...prizes];
                            newPrizes[index].title = e.target.value;
                            setPrizes(newPrizes);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPrizes(prev => prev.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Rules</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addRule}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {rules.map((rule, index) => (
                      <div key={index} className="flex gap-2 items-center p-2 border rounded">
                        <Input
                          placeholder="Rule description"
                          value={rule.description}
                          onChange={(e) => {
                            const newRules = [...rules];
                            newRules[index].description = e.target.value;
                            setRules(newRules);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRules(prev => prev.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCompetition}>
                    Create Competition
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          {(userRole === 'admin' || userRole === 'moderator') && (
            <TabsTrigger value="my_competitions">My Competitions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredCompetitions.length > 0 ? (
            filteredCompetitions.map((competition) => (
              <Card key={competition.competitionId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{competition.title}</CardTitle>
                        {getStatusBadge(competition.status)}
                      </div>
                      <p className="text-muted-foreground">{competition.description}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {competition.status === 'registration_open' && (
                        <Button size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Duration</div>
                        <div className="text-xs text-muted-foreground">
                          {competition.startDate.toLocaleDateString()} - {competition.endDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{competition.metadata.totalParticipants}</div>
                        <div className="text-xs text-muted-foreground">Participants</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {formatDuration(competition.metadata.estimatedDuration)}
                        </div>
                        <div className="text-xs text-muted-foreground">Est. Duration</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{competition.metadata.topScore}</div>
                        <div className="text-xs text-muted-foreground">Top Score</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {competition.metadata.skillsTargeted.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    <Badge variant="outline">
                      {competition.metadata.difficultyLevel}
                    </Badge>
                  </div>
                  
                  {competition.prizes.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Prizes:</div>
                      <div className="flex flex-wrap gap-2">
                        {competition.prizes.slice(0, 3).map((prize, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {typeof prize.rank === 'number' ? `#${prize.rank}` : prize.rank}: {prize.title}
                          </Badge>
                        ))}
                        {competition.prizes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{competition.prizes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No competitions found in this category</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}