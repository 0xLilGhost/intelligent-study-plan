import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GoalCard } from './GoalCard';
import { Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TodayDashboardProps {
  userId: string;
  onAddNewTrail: () => void;
}

interface Goal {
  id: string;
  title: string;
  target_date?: string;
}

export function TodayDashboard({ userId, onAddNewTrail }: TodayDashboardProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyProgress, setDailyProgress] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadGoalsWithProgress();
  }, [userId]);

  const loadGoalsWithProgress = async () => {
    // Load active goals
    const { data: goalsData } = await supabase
      .from('study_goals')
      .select('id, title, target_date')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (goalsData) {
      setGoals(goalsData);

      // Load progress for each goal
      const progressMap: Record<string, any> = {};
      for (const goal of goalsData) {
        const { data: planData } = await supabase
          .from('study_plans')
          .select('id')
          .eq('goal_id', goal.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (planData) {
          const { data: contentData } = await supabase
            .from('daily_study_content')
            .select('id, completed, day_number')
            .eq('plan_id', planData.id);

          if (contentData) {
            progressMap[goal.id] = {
              total: contentData.length,
              completed: contentData.filter(c => c.completed).length,
              todaySteps: contentData.length > 0 ? Math.ceil(100 / contentData.length) : 0,
            };
          }
        }

        if (!progressMap[goal.id]) {
          progressMap[goal.id] = { total: 0, completed: 0 };
        }
      }
      setDailyProgress(progressMap);
    }
  };

  return (
    <div className="space-y-6">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          dailyProgress={dailyProgress[goal.id] || { total: 0, completed: 0 }}
        />
      ))}

      <Button
        variant="outline"
        size="lg"
        className="w-full border-dashed border-2"
        onClick={onAddNewTrail}
      >
        <Plus className="mr-2 h-5 w-5" />
        Add New Trail
      </Button>

      {goals.length > 0 && (
        <div className="text-center">
          <Button variant="link" className="text-primary">
            View Upcoming <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
