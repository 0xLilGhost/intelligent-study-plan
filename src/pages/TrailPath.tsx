import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { ArrowLeft, Target, MapPin, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';
import mountainTrail from '@/assets/mountain-trail.jpg';
import { useAuth } from '@/hooks/useAuth';

interface DailyContent {
  id: string;
  day_number: number;
  content: string;
  completed: boolean;
}

export default function TrailPath() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goal, setGoal] = useState<any>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [dailyContent, setDailyContent] = useState<DailyContent[]>([]);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (goalId) {
      loadGoalAndPlan();
    }
  }, [goalId]);

  const loadGoalAndPlan = async () => {
    setLoading(true);
    // Load goal
    const { data: goalData } = await supabase
      .from('study_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalData) {
      setGoal(goalData);
    }

    // Load existing plan
    const { data: planData } = await supabase
      .from('study_plans')
      .select('id, plan_content')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planData) {
      setPlan(planData.plan_content);
      setPlanId(planData.id);
      loadDailyContent(planData.id);
    }
    setLoading(false);
  };

  const loadDailyContent = async (plan_id: string) => {
    const { data } = await supabase
      .from('daily_study_content')
      .select('*')
      .eq('plan_id', plan_id)
      .order('day_number', { ascending: true });

    if (data) {
      setDailyContent(data);
      setDayNumber(data.length + 1);
    }
  };

  const generatePlan = async () => {
    if (!goalId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: { goalId },
      });

      if (error) throw error;

      setPlan(data.plan);

      const { data: planData } = await supabase
        .from('study_plans')
        .select('id')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planData) {
        setPlanId(planData.id);
        loadDailyContent(planData.id);
      }

      toast({
        title: 'Trail path generated!',
        description: 'Your personalized journey is ready.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to generate trail',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDailyContent = async () => {
    if (!planId || !dayNumber) return;

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
        title: `Day ${dayNumber} checkpoint generated!`,
        description: 'Your daily guide is ready.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to generate checkpoint',
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

    if (!error) {
      setDailyContent(prev =>
        prev.map(c => c.id === contentId ? { ...c, completed } : c)
      );
    }
  };

  if (loading && !goal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const workDays = dailyContent.filter(c => !c.completed).length;
  const restDays = 0; // Can be enhanced to track rest days

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${mountainTrail})`,
          filter: 'brightness(0.3) blur(2px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen bg-background/80 backdrop-blur-sm">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Your Trail Path</h1>
              <Button variant="ghost" size="icon">
                <Target className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Goal Info */}
          {goal && (
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{goal.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {dailyContent.length} total • Due {goal.target_date ? new Date(goal.target_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Not set'}
                </p>
              </div>
            </div>
          )}

          {/* Work/Rest Days */}
          {dailyContent.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="outline" className="border-primary text-primary">
                {workDays} work days
              </Badge>
              <Badge variant="outline">
                {restDays} rest days
              </Badge>
            </div>
          )}

          {/* File Upload Section */}
          {user && (
            <FileUpload userId={user.id} onUploadSuccess={loadGoalAndPlan} />
          )}

          {/* Generate Plan if not exists */}
          {!plan && (
            <Button onClick={generatePlan} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Trail...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate My Trail Path
                </>
              )}
            </Button>
          )}

          {/* Plan Overview (collapsible) */}
          {plan && (
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Trail Overview
              </h3>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{plan}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Generate Daily Checkpoint */}
          {plan && (
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Generate Daily Checkpoints</h3>
              <div className="flex gap-2">
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
            </div>
          )}

          {/* Daily Checkpoints List */}
          {dailyContent.length > 0 && (
            <div className="space-y-3">
              {dailyContent.map((content, index) => (
                <div
                  key={content.id}
                  className={`bg-card rounded-lg p-4 border transition-all ${
                    content.completed ? 'border-primary/30 bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      content.completed ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Day {content.day_number}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rest</span>
                          <Switch
                            checked={content.completed}
                            onCheckedChange={(checked) => toggleDayCompletion(content.id, checked)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>38 steps</span>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{content.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Start Journey Button */}
          {dailyContent.length > 0 && (
            <Button size="lg" className="w-full">
              Start My Hiking Journey
            </Button>
          )}
        </main>
      </div>
    </div>
  );
}
