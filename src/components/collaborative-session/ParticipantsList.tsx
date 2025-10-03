'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Crown, 
  Eye, 
  Edit3, 
  MessageSquare, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  UserPlus,
  Settings,
  MoreVertical,
  Shield,
  UserX,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { SessionParticipant } from '@/types/collaborative-session';
import { formatDistanceToNow } from 'date-fns';

interface ParticipantsListProps {
  sessionId: string;
  currentUserId: string;
  participants: SessionParticipant[];
  isHost: boolean;
  onInviteParticipant: () => void;
  onUpdateParticipantRole: (userId: string, role: 'host' | 'participant' | 'observer') => void;
  onUpdateParticipantPermissions: (userId: string, permissions: Partial<SessionParticipant>) => void;
  onRemoveParticipant: (userId: string) => void;
  onPromoteToHost: (userId: string) => void;
}

export function ParticipantsList({
  sessionId,
  currentUserId,
  participants,
  isHost,
  onInviteParticipant,
  onUpdateParticipantRole,
  onUpdateParticipantPermissions,
  onRemoveParticipant,
  onPromoteToHost
}: ParticipantsListProps) {
  const [showOfflineParticipants, setShowOfflineParticipants] = useState(false);

  const activeParticipants = participants.filter(p => p.isActive);
  const offlineParticipants = participants.filter(p => !p.isActive);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'host': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'observer': return <Eye className="h-3 w-3 text-blue-500" />;
      default: return <Edit3 className="h-3 w-3 text-green-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'host': return 'default';
      case 'observer': return 'secondary';
      default: return 'outline';
    }
  };

  const getActivityStatus = (participant: SessionParticipant) => {
    if (!participant.isActive) return 'offline';
    
    const timeSinceActivity = Date.now() - participant.lastActivity.getTime();
    if (timeSinceActivity < 30000) return 'active'; // 30 seconds
    if (timeSinceActivity < 300000) return 'idle'; // 5 minutes
    return 'away';
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const renderParticipant = (participant: SessionParticipant) => {
    const isCurrentUser = participant.userId === currentUserId;
    const activityStatus = getActivityStatus(participant);
    const canManage = isHost && !isCurrentUser;

    return (
      <div key={participant.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/avatars/${participant.username}.png`} />
            <AvatarFallback className="text-xs">
              {participant.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Activity indicator */}
          <div 
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getActivityColor(activityStatus)}`}
            title={`${activityStatus} - last seen ${formatDistanceToNow(participant.lastActivity, { addSuffix: true })}`}
          />
          
          {/* Typing indicator */}
          {participant.isTyping && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {participant.username}
              {isCurrentUser && <span className="text-muted-foreground"> (you)</span>}
            </span>
            {getRoleIcon(participant.role)}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getRoleBadgeVariant(participant.role)} className="text-xs">
              {participant.role}
            </Badge>
            
            {participant.isTyping && (
              <Badge variant="outline" className="text-xs animate-pulse">
                typing...
              </Badge>
            )}
          </div>

          {/* Permissions indicators */}
          <div className="flex items-center gap-1 mt-1">
            {participant.canEdit && (
              <Edit3 className="h-3 w-3 text-green-500" title="Can edit code" />
            )}
            {participant.canSuggest && (
              <MessageSquare className="h-3 w-3 text-blue-500" title="Can make suggestions" />
            )}
            {participant.canComment && (
              <MessageSquare className="h-3 w-3 text-purple-500" title="Can comment" />
            )}
          </div>

          {/* Contribution stats */}
          {participant.linesAdded > 0 || participant.linesModified > 0 || participant.suggestionsGiven > 0 ? (
            <div className="text-xs text-muted-foreground mt-1">
              {participant.linesAdded > 0 && `+${participant.linesAdded} lines `}
              {participant.linesModified > 0 && `~${participant.linesModified} modified `}
              {participant.suggestionsGiven > 0 && `${participant.suggestionsGiven} suggestions`}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateParticipantRole(participant.userId, 'host')}>
                <Crown className="h-4 w-4 mr-2" />
                Promote to Host
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateParticipantRole(participant.userId, 'participant')}>
                <Edit3 className="h-4 w-4 mr-2" />
                Make Participant
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateParticipantRole(participant.userId, 'observer')}>
                <Eye className="h-4 w-4 mr-2" />
                Make Observer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onUpdateParticipantPermissions(participant.userId, { canEdit: !participant.canEdit })}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {participant.canEdit ? 'Remove Edit Access' : 'Grant Edit Access'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onUpdateParticipantPermissions(participant.userId, { canSuggest: !participant.canSuggest })}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {participant.canSuggest ? 'Remove Suggest Access' : 'Grant Suggest Access'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onRemoveParticipant(participant.userId)}
                className="text-destructive"
              >
                <UserX className="h-4 w-4 mr-2" />
                Remove from Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants
            <Badge variant="outline">
              {activeParticipants.length}/{participants.length}
            </Badge>
          </CardTitle>
          
          {isHost && (
            <Button
              size="sm"
              variant="outline"
              onClick={onInviteParticipant}
              className="h-8"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {/* Active participants */}
        <div className="p-4">
          {activeParticipants.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div>No active participants</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Active ({activeParticipants.length})
              </div>
              {activeParticipants.map(renderParticipant)}
            </div>
          )}
        </div>

        {/* Offline participants */}
        {offlineParticipants.length > 0 && (
          <div className="border-t p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOfflineParticipants(!showOfflineParticipants)}
              className="w-full justify-between h-8 mb-2"
            >
              <span className="text-sm font-medium text-muted-foreground">
                Offline ({offlineParticipants.length})
              </span>
              <span className="text-muted-foreground">
                {showOfflineParticipants ? '−' : '+'}
              </span>
            </Button>
            
            {showOfflineParticipants && (
              <div className="space-y-1">
                {offlineParticipants.map(renderParticipant)}
              </div>
            )}
          </div>
        )}

        {/* Session stats */}
        <div className="border-t p-4 bg-muted/20">
          <div className="text-sm font-medium mb-2">Session Stats</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <div className="font-medium">Total Lines Added</div>
              <div>{participants.reduce((sum, p) => sum + p.linesAdded, 0)}</div>
            </div>
            <div>
              <div className="font-medium">Total Suggestions</div>
              <div>{participants.reduce((sum, p) => sum + p.suggestionsGiven, 0)}</div>
            </div>
            <div>
              <div className="font-medium">Avg Helpfulness</div>
              <div>
                {participants.length > 0 
                  ? Math.round(participants.reduce((sum, p) => sum + p.helpfulnessScore, 0) / participants.length * 10) / 10
                  : 0
                }/5
              </div>
            </div>
            <div>
              <div className="font-medium">Active Time</div>
              <div>
                {Math.round(
                  activeParticipants.reduce((sum, p) => {
                    const activeTime = Date.now() - p.joinedAt.getTime();
                    return sum + activeTime;
                  }, 0) / (1000 * 60 * activeParticipants.length)
                )} min
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}