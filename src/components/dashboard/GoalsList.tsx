import { useEffect, useState } from 'react';
import { mockGoalsApi, mockPlansApi, Goal } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoalsListProps {
  userId: string;
  onPlanGenerated?: () => void;
  onGoalsLoaded?: (count: number) => void;
}

export function GoalsList({ userId, onPlanGenerated, onGoalsLoaded }: GoalsListProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingForGoal, setGeneratingForGoal] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const fetchedGoals = await mockGoalsApi.getGoals(userId);
      setGoals(fetchedGoals);
      onGoalsLoaded?.(fetchedGoals.length);
    } catch (error: any) {
      toast({
        title: 'Failed to load goals',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (goalId: string) => {
    setGeneratingForGoal(goalId);
    try {
      await mockPlansApi.generatePlan(goalId);
      toast({
        title: 'Study plan generated!',
        description: 'Your personalized learning path is ready.',
      });
      onPlanGenerated?.();
    } catch (error: any) {
      toast({
        title: 'Failed to generate plan',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setGeneratingForGoal(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Your Learning Goals
        </CardTitle>
        <CardDescription>
          Manage your goals and generate study plans
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No goals yet. Create your first goal to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 border rounded-lg hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium truncate">{goal.title}</h4>
                      {goal.completed && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                        goal.priority === 'medium' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {goal.priority}
                      </span>
                      {goal.completed && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGeneratePlan(goal.id)}
                    disabled={generatingForGoal === goal.id}
                  >
                    {generatingForGoal === goal.id ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3" />
                        Generate Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
