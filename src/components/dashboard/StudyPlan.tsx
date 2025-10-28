import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Loader2, Sparkles, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
}

export function StudyPlan({ userId }: StudyPlanProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dayNumber, setDayNumber] = useState(1);
  const [dailyContent, setDailyContent] = useState<DailyContent[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
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

  const loadDailyContent = async (currentPlanId: string) => {
    const { data } = await supabase
      .from('daily_study_content')
      .select('*')
      .eq('plan_id', currentPlanId)
      .order('day_number', { ascending: true });

    if (data) {
      setDailyContent(data);
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
      
      // Get the plan ID to enable daily content generation
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

  const generateDailyContent = async () => {
    if (!planId || !dayNumber) return;

    setLoadingDaily(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-content', {
        body: { planId, dayNumber },
      });

      if (error) throw error;
      
      await loadDailyContent(planId);
      setSelectedDay(dayNumber);
      
      toast({
        title: 'Daily content generated!',
        description: `Study content for Day ${dayNumber} is ready.`,
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

                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Daily Study Content
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate detailed study content for specific days to guide your learning
                  </p>
                  
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                      <Label htmlFor="dayNumber">Day Number</Label>
                      <Input
                        id="dayNumber"
                        type="number"
                        min="1"
                        value={dayNumber}
                        onChange={(e) => setDayNumber(parseInt(e.target.value))}
                        placeholder="Enter day number"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={generateDailyContent} disabled={loadingDaily}>
                        {loadingDaily ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {dailyContent.length > 0 && (
                    <div className="space-y-2">
                      <Label>Generated Days:</Label>
                      <div className="flex flex-wrap gap-2">
                        {dailyContent.map((day) => (
                          <Button
                            key={day.id}
                            variant={selectedDay === day.day_number ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDay(day.day_number)}
                          >
                            Day {day.day_number}
                          </Button>
                        ))}
                      </div>

                      {selectedDay && dailyContent.find(d => d.day_number === selectedDay) && (
                        <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                          <h5 className="font-semibold mb-2">Day {selectedDay} Content:</h5>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>
                              {dailyContent.find(d => d.day_number === selectedDay)?.content || ''}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
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
