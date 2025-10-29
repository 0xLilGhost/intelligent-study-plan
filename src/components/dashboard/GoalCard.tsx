import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Play, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    target_date?: string;
  };
  dailyProgress: {
    total: number;
    completed: number;
    todaySteps?: number;
  };
}

export function GoalCard({ goal, dailyProgress }: GoalCardProps) {
  const navigate = useNavigate();
  const progressPercentage = dailyProgress.total > 0 
    ? Math.round((dailyProgress.completed / dailyProgress.total) * 100) 
    : 0;

  const handleViewTrail = () => {
    navigate(`/trail/${goal.id}`);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1">{goal.title}</h3>
            {dailyProgress.todaySteps && (
              <p className="text-sm text-muted-foreground mb-1">
                Today: {dailyProgress.todaySteps} steps
              </p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                {dailyProgress.completed}/{dailyProgress.total} days
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary">
            <div className="text-center">
              <div className="text-xl font-bold">{progressPercentage}%</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleViewTrail}
            className="flex-1"
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Focus Timer
          </Button>
          <Button 
            onClick={handleViewTrail}
            variant="outline" 
            size="lg"
          >
            Check-in
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
