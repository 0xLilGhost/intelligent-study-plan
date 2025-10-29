import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Loader2, Sparkles, Calendar, CheckCircle2, Circle } from 'lucide-react';
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
  completed: boolean;
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

  useEffect(() => {
    if (selectedGoalId) {
      loadExistingPlan(selectedGoalId);
    }
  }, [selectedGoalId]);

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

  const loadExistingPlan = async (goalId: string) => {
    // Load existing plan if available
    const { data: existingPlan } = await supabase
      .from('study_plans')
      .select('id, plan_content')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPlan) {
      setPlan(existingPlan.plan_content);
      setPlanId(existingPlan.id);
      loadDailyContent(existingPlan.id);
    } else {
      setPlan(null);
      setPlanId(null);
      setDailyContent([]);
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

    // Check if content for this day already exists
    const existingContent = dailyContent.find(c => c.day_number === dayNumber);
    if (existingContent) {
      toast({
        title: 'Content already exists',
        description: `Day ${dayNumber} content is already generated.`,
        variant: 'destructive',
      });
      return;
    }

    setLoadingDaily(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-content', {
        body: { planId, dayNumber },
      });

      if (error) throw error;
      
      setDailyContent(prev => [...prev, data.content].sort((a, b) => a.day_number - b.day_number));
      setDayNumber(dayNumber + 1);
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

  const toggleDayCompletion = async (contentId: string, completed: boolean) => {
    const { error } = await supabase
      .from('daily_study_content')
      .update({ completed })
      .eq('id', contentId);

    if (error) {
      toast({
        title: 'Failed to update progress',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setDailyContent(prev =>
      prev.map(c => c.id === contentId ? { ...c, completed } : c)
    );
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

            {!plan && (
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
            )}

            {plan && (
              <div className="space-y-6">
                {/* Study Plan Overview */}
                <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Your Study Plan
                    </h4>
                    <Button 
                      onClick={generatePlan} 
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-3 w-3" />
                          Regenerate Plan
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{plan}</ReactMarkdown>
                  </div>
                </div>

                {/* Daily Study Content Section */}
                <div className="p-5 border-2 border-primary/20 rounded-lg bg-card/50">
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Daily Study Content
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Generate detailed study materials for each day of your plan
                    </p>
                  </div>
                  
                  {/* Generate Daily Content Controls */}
                  <div className="flex gap-2 mb-6 p-3 bg-secondary/30 rounded-lg">
                    <Input
                      type="number"
                      min="1"
                      value={dayNumber}
                      onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                      placeholder="Day #"
                      className="w-24"
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
                          Generate Day {dayNumber}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Daily Content List */}
                  {dailyContent.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Progress: {dailyContent.filter(c => c.completed).length} / {dailyContent.length} days completed
                        </p>
                      </div>
                      {dailyContent.map((content) => (
                        <div 
                          key={content.id} 
                          className={`p-4 rounded-lg border transition-all ${
                            content.completed 
                              ? 'bg-primary/5 border-primary/30' 
                              : 'bg-secondary/20 border-secondary'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleDayCompletion(content.id, !content.completed)}
                              className="mt-1 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                            >
                              {content.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <h5 className={`font-semibold mb-2 flex items-center gap-2 ${
                                content.completed ? 'text-primary' : ''
                              }`}>
                                Day {content.day_number}
                                {content.completed && (
                                  <span className="text-xs px-2 py-0.5 bg-primary/20 rounded-full">
                                    Completed
                                  </span>
                                )}
                              </h5>
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{content.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No daily content generated yet. Enter a day number above to get started.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
