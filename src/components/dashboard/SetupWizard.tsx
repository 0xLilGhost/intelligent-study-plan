import { useState } from 'react';
import { mockFilesApi, mockGoalsApi, mockPlansApi } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Target, Sparkles, Check, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SetupWizardProps {
  userId: string;
  onComplete: () => void;
}

type Step = 'upload' | 'goal' | 'generating';

export function SetupWizard({ userId, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  // Goal form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);
  
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await mockFilesApi.uploadFile(userId, file);
      setUploadedFile(uploaded);
      toast({
        title: 'File uploaded!',
        description: 'Now let\'s create your learning goal.',
      });
      setStep('goal');
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const goal = await mockGoalsApi.createGoal(userId, title, priority);
      
      toast({
        title: 'Goal created!',
        description: 'Generating your personalized study plan...',
      });

      setStep('generating');
      
      // Generate the plan
      await mockPlansApi.generatePlan(goal.id);
      
      toast({
        title: 'Study plan ready!',
        description: 'Your learning journey begins now.',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Failed to create goal',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
        {uploadedFile ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            step === 'upload' ? 'border-primary' : 'border-muted'
          }`}>
            1
          </div>
        )}
        <span className="text-sm font-medium hidden sm:inline">Upload</span>
      </div>
      
      <div className="w-12 h-0.5 bg-border" />
      
      <div className={`flex items-center gap-2 ${step === 'goal' ? 'text-primary' : 'text-muted-foreground'}`}>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          step === 'goal' ? 'border-primary' : 'border-muted'
        }`}>
          2
        </div>
        <span className="text-sm font-medium hidden sm:inline">Goal</span>
      </div>
      
      <div className="w-12 h-0.5 bg-border" />
      
      <div className={`flex items-center gap-2 ${step === 'generating' ? 'text-primary' : 'text-muted-foreground'}`}>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          step === 'generating' ? 'border-primary' : 'border-muted'
        }`}>
          3
        </div>
        <span className="text-sm font-medium hidden sm:inline">Generate</span>
      </div>
    </div>
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create Your Learning Plan
        </CardTitle>
        <CardDescription>
          Upload materials, set your goal, and get a personalized study plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepIndicator()}

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Study Materials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add documents, notes, or any learning resources
              </p>
            </div>
            <label className="block">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx"
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading}
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </>
                )}
              </Button>
            </label>
            {uploadedFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{uploadedFile.file_name}</span>
                </div>
                <Button size="sm" onClick={() => setStep('goal')}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'goal' && (
          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Set Your Learning Goal</h3>
              <p className="text-sm text-muted-foreground">
                Define what you want to achieve with {uploadedFile?.file_name}
              </p>
            </div>

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

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('upload')}
                className="flex-1"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Generate Plan <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'generating' && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Creating Your Study Plan</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we generate your personalized learning journey...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
