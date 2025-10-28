import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Loader2, Sparkles, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';

interface StudyPlanProps {
  userId: string;
}

interface Goal {
  id: string;
  title: string;
  priority: string;
}

interface DailyContent {
  id: string;
  day_number: number;
  content: string;
  created_at: string;
}

export function StudyPlan({ userId }: StudyPlanProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyContent, setDailyContent] = useState<DailyContent[]>([]);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [loadingDaily, setLoadingDaily] = useState(false);
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
      
      // Get the plan ID to use for daily content generation
      const { data: planData } = await supabase
        .from('study_plans')
        .select('id')
        .eq('goal_id', selectedGoalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (planData) {
        setPlanId(planData.id);
        loadDailyContent(planData.id);
      }
      
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

  const loadDailyContent = async (plan_id: string) => {
    const { data } = await supabase
      .from('daily_study_content')
      .select('*')
      .eq('plan_id', plan_id)
      .order('day_number', { ascending: true });
    
    if (data) {
      setDailyContent(data);
    }
  };

  const generateDailyContent = async () => {
    if (!planId || !dayNumber) return;

    setLoadingDaily(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-content', {
        body: { planId, dayNumber },
      });

      if (error) throw error;
      
      setDailyContent(prev => [...prev, data.content]);
      toast({
        title: `Day ${dayNumber} content generated!`,
        description: 'Your daily study guide is ready.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to generate daily content',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingDaily(false);
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
              <>
                <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-lg">Your Personalized Plan:</h4>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{plan}</ReactMarkdown>
                  </div>
                </div>

                <div className="mt-6 p-4 border-2 border-primary/20 rounded-lg bg-card">
                  <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Daily Study Content
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate detailed study content for specific days in your plan
                  </p>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      type="number"
                      min="1"
                      value={dayNumber}
                      onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                      placeholder="Day number"
                      className="w-32"
                    />
                    <Button 
                      onClick={generateDailyContent} 
                      disabled={loadingDaily || !planId}
                      className="flex-1"
                    >
                      {loadingDaily ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Day {dayNumber} Content
                        </>
                      )}
                    </Button>
                  </div>

                  {dailyContent.length > 0 && (
                    <div className="space-y-4 mt-6">
                      {dailyContent.map((content) => (
                        <div key={content.id} className="p-4 bg-secondary/30 rounded-lg">
                          <h5 className="font-semibold mb-2 text-primary">Day {content.day_number}</h5>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{content.content}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
