import { useState } from 'react';
import { mockGoalsApi } from '@/services/mockApi';
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
  recentFiles?: any[];
}

export function GoalForm({ userId, onGoalCreated, recentFiles = [] }: GoalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [linkedFiles, setLinkedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pass empty string for fileId since GoalForm doesn't handle file uploads
      await mockGoalsApi.createGoal(userId, title, priority, '');

      toast({
        title: 'Goal created!',
        description: 'Your study goal has been saved.',
      });

      setTitle('');
      setDescription('');
      setCategory('');
      setLinkedFiles([]);
      onGoalCreated();
    } catch (error: any) {
      toast({
        title: 'Failed to create goal',
        description: error.message || 'An error occurred',
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
          Set Study Goal
        </CardTitle>
        <CardDescription>Define what you want to achieve</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Master React Hooks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your goal in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Web Development"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          {recentFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Link Files (Optional)</Label>
              <div className="space-y-2">
                {recentFiles.map((file) => (
                  <label key={file.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkedFiles.includes(file.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLinkedFiles([...linkedFiles, file.id]);
                        } else {
                          setLinkedFiles(linkedFiles.filter(id => id !== file.id));
                        }
                      }}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{file.file_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Goal'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
