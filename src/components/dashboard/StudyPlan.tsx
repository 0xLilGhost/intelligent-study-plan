import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudyPlanProps {
  userId: string;
}

interface Goal {
  id: string;
  title: string;
  priority: string;
}

export function StudyPlan({ userId }: StudyPlanProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    const { data } = await supabase
      .from('study_goals')
      .select('id, title, priority')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (data) {
      setGoals(data);
      if (data.length > 0) setSelectedGoalId(data[0].id);
    }
  };

  const generatePlan = async () => {
    if (!selectedGoalId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: { goalId: selectedGoalId },
      });

      if (error) throw error;
      
      setPlan(data.plan);
      toast({
        title: 'Study plan generated!',
        description: 'Your personalized learning path is ready.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to generate plan',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Your Study Plan
        </CardTitle>
        <CardDescription>AI-powered learning path based on your goals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Create a goal first to generate a study plan
          </p>
        ) : (
          <>
            <Tabs value={selectedGoalId || undefined} onValueChange={setSelectedGoalId}>
              <TabsList className="w-full">
                {goals.map((goal) => (
                  <TabsTrigger key={goal.id} value={goal.id} className="flex-1">
                    {goal.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Button onClick={generatePlan} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Study Plan
                </>
              )}
            </Button>

            {plan && (
              <div className="mt-4 p-4 bg-secondary rounded-lg">
                <h4 className="font-semibold mb-2">Your Personalized Plan:</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{plan}</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
