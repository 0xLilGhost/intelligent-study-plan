import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoalFormProps {
  userId: string;
  onGoalCreated: () => void;
}

export function GoalForm({ userId, onGoalCreated }: GoalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('study_goals').insert({
        user_id: userId,
        title,
        description,
        priority,
        category,
      });

      if (error) throw error;

      toast({
        title: 'Goal created!',
        description: 'Your study goal has been saved.',
      });

      setTitle('');
      setDescription('');
      setCategory('');
      onGoalCreated();
    } catch (error: any) {
      toast({
        title: 'Failed to create goal',
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
          <Target className="h-5 w-5 text-primary" />
          Create New Trail
        </CardTitle>
        <CardDescription>Set your learning destination</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              What's your hiking goal?
            </Label>
            <Input
              id="title"
              placeholder="e.g., math questions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Total quantity to complete</Label>
            <Input
              id="description"
              type="number"
              placeholder="e.g., 300"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">When do you want to complete this?</Label>
            <Input
              id="category"
              type="date"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-base"
            />
          </div>

          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your goal will be broken into daily checkpoints</li>
              <li>• Complete checkpoints to build your streak</li>
              <li>• Earn tokens for each completed day</li>
              <li>• Use focus timers to stay on track</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Trail...
              </>
            ) : (
              'Generate My Trail Path'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
