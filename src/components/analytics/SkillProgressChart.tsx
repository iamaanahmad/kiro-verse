"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SkillLevel } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface SkillProgressChartProps {
  skillLevels: SkillLevel[];
  title?: string;
  className?: string;
  chartType?: 'line' | 'area' | 'bar';
  showTrends?: boolean;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  [skillName: string]: number | string;
}

const SkillProgressChart: React.FC<SkillProgressChartProps> = ({
  skillLevels,
  title = "Skill Progression",
  className,
  chartType = 'line',
  showTrends = true
}) => {
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [viewType, setViewType] = React.useState<'level' | 'experience'>('level');

  // Process skill data for chart visualization
  const chartData = useMemo(() => {
    if (skillLevels.length === 0) return [];

    // Get all unique dates from progress history
    const allDates = new Set<string>();
    skillLevels.forEach(skill => {
      skill.progressHistory.forEach(point => {
        allDates.add(new Date(point.timestamp).toISOString().split('T')[0]);
      });
    });

    const sortedDates = Array.from(allDates).sort();
    
    // Filter dates based on time range
    const now = new Date();
    const filteredDates = sortedDates.filter(date => {
      const dateObj = new Date(date);
      const daysDiff = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24);
      
      switch (timeRange) {
        case '7d': return daysDiff <= 7;
        case '30d': return daysDiff <= 30;
        case '90d': return daysDiff <= 90;
        default: return true;
      }
    });

    // Build chart data points
    const data: ChartDataPoint[] = filteredDates.map(date => {
      const dataPoint: ChartDataPoint = {
        date: new Date(date).toLocaleDateString(),
        timestamp: new Date(date).getTime()
      };

      // Add data for each skill
      skillLevels.forEach(skill => {
        const skillsToShow = selectedSkills.length > 0 ? selectedSkills : [skill.skillName];
        
        if (skillsToShow.includes(skill.skillName)) {
          // Find the latest progress point up to this date
          const relevantPoints = skill.progressHistory.filter(point => 
            new Date(point.timestamp).toISOString().split('T')[0] <= date
          );
          
          if (relevantPoints.length > 0) {
            const latestPoint = relevantPoints[relevantPoints.length - 1];
            dataPoint[skill.skillName] = viewType === 'level' 
              ? latestPoint.level 
              : latestPoint.experiencePoints;
          } else {
            dataPoint[skill.skillName] = 0;
          }
        }
      });

      return dataPoint;
    });

    return data;
  }, [skillLevels, selectedSkills, timeRange, viewType]);

  // Get skills to display in chart
  const displaySkills = useMemo(() => {
    if (selectedSkills.length > 0) {
      return skillLevels.filter(skill => selectedSkills.includes(skill.skillName));
    }
    // Show top 5 skills by level if none selected
    return skillLevels
      .sort((a, b) => b.currentLevel - a.currentLevel)
      .slice(0, 5);
  }, [skillLevels, selectedSkills]);

  // Chart configuration for colors
  const chartConfig = useMemo(() => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))'
    ];

    const config: any = {};
    displaySkills.forEach((skill, index) => {
      config[skill.skillName] = {
        label: skill.skillName,
        color: colors[index % colors.length]
      };
    });

    return config;
  }, [displaySkills]);

  const handleSkillToggle = (skillName: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillName)) {
        return prev.filter(name => name !== skillName);
      } else {
        return [...prev, skillName];
      }
    });
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'declining': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            {displaySkills.map((skill) => (
              <Area
                key={skill.skillName}
                type="monotone"
                dataKey={skill.skillName}
                stroke={chartConfig[skill.skillName]?.color}
                fill={chartConfig[skill.skillName]?.color}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            {displaySkills.map((skill) => (
              <Bar
                key={skill.skillName}
                dataKey={skill.skillName}
                fill={chartConfig[skill.skillName]?.color}
              />
            ))}
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            {displaySkills.map((skill) => (
              <Line
                key={skill.skillName}
                type="monotone"
                dataKey={skill.skillName}
                stroke={chartConfig[skill.skillName]?.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  if (skillLevels.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No skill data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Start coding to see your skill progression!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Track your skill development over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
                <SelectItem value="90d">90d</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="level">Level</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Skill Selection */}
        <div className="flex flex-wrap gap-2 mt-4">
          {skillLevels.map((skill) => (
            <Badge
              key={skill.skillId}
              variant={selectedSkills.includes(skill.skillName) || selectedSkills.length === 0 ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors",
                selectedSkills.includes(skill.skillName) || selectedSkills.length === 0
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
              onClick={() => handleSkillToggle(skill.skillName)}
            >
              <span className="flex items-center gap-1">
                {skill.skillName}
                {showTrends && getTrendIcon(skill.trendDirection)}
              </span>
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          {renderChart()}
        </ChartContainer>

        {/* Chart Legend */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {displaySkills.map((skill) => (
            <div key={skill.skillId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: chartConfig[skill.skillName]?.color }}
                />
                <span>{skill.skillName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {viewType === 'level' ? `L${skill.currentLevel}` : `${skill.experiencePoints}xp`}
                </span>
                {showTrends && getTrendIcon(skill.trendDirection)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillProgressChart;
export { SkillProgressChart };