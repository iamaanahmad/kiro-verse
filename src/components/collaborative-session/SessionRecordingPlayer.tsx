'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  Download,
  Share,
  Clock,
  Users,
  Code,
  MessageSquare,
  Lightbulb,
  FastForward,
  Rewind
} from 'lucide-react';
import { 
  SessionRecording, 
  TimestampedEvent, 
  KeyMoment 
} from '@/types/collaborative-session';
import { formatDuration } from 'date-fns';

interface SessionRecordingPlayerProps {
  recording: SessionRecording;
  onDownload?: () => void;
  onShare?: () => void;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
}

export function SessionRecordingPlayer({
  recording,
  onDownload,
  onShare
}: SessionRecordingPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    playbackSpeed: 1,
    volume: 1,
    isMuted: false
  });
  
  const [currentEvent, setCurrentEvent] = useState<TimestampedEvent | null>(null);
  const [codeContent, setCodeContent] = useState(recording.finalCode);
  const [showKeyMoments, setShowKeyMoments] = useState(true);
  const [selectedKeyMoment, setSelectedKeyMoment] = useState<KeyMoment | null>(null);
  
  const playbackIntervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

  // Sort events by timestamp
  const sortedEvents = [...recording.events].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Sort key moments by timestamp
  const sortedKeyMoments = [...recording.keyMoments].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Calculate total duration
  const totalDuration = recording.duration * 60 * 1000; // Convert minutes to milliseconds

  useEffect(() => {
    if (playbackState.isPlaying) {
      startTimeRef.current = Date.now() - playbackState.currentTime;
      
      playbackIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) * playbackState.playbackSpeed;
        
        if (elapsed >= totalDuration) {
          handleStop();
          return;
        }
        
        setPlaybackState(prev => ({ ...prev, currentTime: elapsed }));
        
        // Find and apply current event
        const currentEventIndex = sortedEvents.findIndex(
          event => event.timestamp.getTime() <= elapsed
        );
        
        if (currentEventIndex >= 0) {
          const event = sortedEvents[currentEventIndex];
          setCurrentEvent(event);
          applyEvent(event);
        }
      }, 100);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [playbackState.isPlaying, playbackState.playbackSpeed, totalDuration]);

  const applyEvent = (event: TimestampedEvent) => {
    switch (event.type) {
      case 'code_change':
        if (event.data.codeContent) {
          setCodeContent(event.data.codeContent);
        }
        break;
      // Add other event types as needed
    }
  };

  const handlePlay = () => {
    setPlaybackState(prev => ({ ...prev, isPlaying: true }));
  };

  const handlePause = () => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleStop = () => {
    setPlaybackState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentTime: 0 
    }));
    setCodeContent(recording.finalCode);
    setCurrentEvent(null);
  };

  const handleSeek = (time: number) => {
    setPlaybackState(prev => ({ ...prev, currentTime: time }));
    
    // Apply all events up to this time
    const eventsToApply = sortedEvents.filter(
      event => event.timestamp.getTime() <= time
    );
    
    // Reset to initial state and apply events
    setCodeContent('');
    eventsToApply.forEach(applyEvent);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackState(prev => ({ ...prev, playbackSpeed: speed }));
  };

  const handleVolumeChange = (volume: number) => {
    setPlaybackState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
  };

  const jumpToKeyMoment = (moment: KeyMoment) => {
    const momentTime = moment.timestamp.getTime();
    handleSeek(momentTime);
    setSelectedKeyMoment(moment);
  };

  const skipForward = () => {
    const newTime = Math.min(playbackState.currentTime + 10000, totalDuration);
    handleSeek(newTime);
  };

  const skipBackward = () => {
    const newTime = Math.max(playbackState.currentTime - 10000, 0);
    handleSeek(newTime);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'code_change': return <Code className="h-3 w-3" />;
      case 'ai_suggestion': return <Lightbulb className="h-3 w-3" />;
      case 'comment': return <MessageSquare className="h-3 w-3" />;
      case 'participant_join': return <Users className="h-3 w-3 text-green-500" />;
      case 'participant_leave': return <Users className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getKeyMomentColor = (type: string) => {
    switch (type) {
      case 'breakthrough': return 'bg-green-500';
      case 'learning': return 'bg-blue-500';
      case 'collaboration': return 'bg-purple-500';
      case 'problem_solving': return 'bg-orange-500';
      case 'ai_insight': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Recording header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                {recording.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.round(recording.duration)} minutes
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {recording.keyMoments.reduce((participants, moment) => {
                    moment.participantsInvolved.forEach(p => participants.add(p));
                    return participants;
                  }, new Set()).size} participants
                </span>
                <span>{recording.viewCount} views</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {onShare && (
                <Button variant="outline" size="sm" onClick={onShare}>
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
              )}
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main player */}
        <div className="lg:col-span-2 space-y-4">
          {/* Code viewer */}
          <Card className="h-96">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Code Playback</CardTitle>
              {currentEvent && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getEventIcon(currentEvent.type)}
                  <span>{currentEvent.description}</span>
                  <Badge variant="outline" className="text-xs">
                    {formatTime(currentEvent.timestamp.getTime())}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="h-full bg-muted rounded p-4 font-mono text-sm overflow-auto">
                <pre className="whitespace-pre-wrap">{codeContent}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Player controls */}
          <Card>
            <CardContent className="p-4">
              {/* Progress bar */}
              <div className="mb-4">
                <Slider
                  value={[playbackState.currentTime]}
                  max={totalDuration}
                  step={1000}
                  onValueChange={([value]) => handleSeek(value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatTime(playbackState.currentTime)}</span>
                  <span>{formatTime(totalDuration)}</span>
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipBackward}
                >
                  <Rewind className="h-4 w-4" />
                </Button>
                
                {playbackState.isPlaying ? (
                  <Button onClick={handlePause}>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={handlePlay}>
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                >
                  <Square className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipForward}
                >
                  <FastForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Speed and volume controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Speed:</span>
                  {[0.5, 1, 1.5, 2].map(speed => (
                    <Button
                      key={speed}
                      variant={playbackState.playbackSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSpeedChange(speed)}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPlaybackState(prev => ({ ...prev, isMuted: !prev.isMuted }))}
                  >
                    {playbackState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[playbackState.isMuted ? 0 : playbackState.volume]}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => handleVolumeChange(value)}
                    className="w-20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Key moments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Key Moments
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeyMoments(!showKeyMoments)}
                >
                  {showKeyMoments ? '−' : '+'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showKeyMoments && (
              <CardContent className="p-0">
                <div className="max-h-64 overflow-y-auto">
                  {sortedKeyMoments.map((moment, index) => (
                    <div
                      key={moment.momentId}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedKeyMoment?.momentId === moment.momentId ? 'bg-muted' : ''
                      }`}
                      onClick={() => jumpToKeyMoment(moment)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className={`w-2 h-2 rounded-full ${getKeyMomentColor(moment.type)}`}
                        />
                        <span className="font-medium text-sm">{moment.title}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {formatTime(moment.timestamp.getTime())}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {moment.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Importance: {moment.importance}/10
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Learning outcomes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recording.learningOutcomes.map((outcome, index) => (
                  <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                    {outcome}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills improved */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills Improved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {recording.skillsImproved.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}