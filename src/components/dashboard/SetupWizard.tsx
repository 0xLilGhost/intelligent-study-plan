import { useState, useEffect } from 'react';
import { mockFilesApi, mockGoalsApi, mockPlansApi, Goal } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Target, Sparkles, Check, Loader2, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface SetupWizardProps {
  userId: string;
  onComplete: () => void;
}

type Step = 'upload' | 'goal' | 'select' | 'generating' | 'preview';

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
  
  // Goal selection state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Plan preview state
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (step === 'select') {
      loadGoals();
    }
  }, [step]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const fetchedGoals = await mockGoalsApi.getGoals(userId);
      setGoals(fetchedGoals);
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
      await mockGoalsApi.createGoal(userId, title, priority);
      
      toast({
        title: 'Goal created!',
        description: 'Now select a goal to generate a plan.',
      });

      setStep('select');
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

  const handleGeneratePlan = async () => {
    if (!selectedGoalId) {
      toast({
        title: 'No goal selected',
        description: 'Please select a goal to generate a plan.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setStep('generating');

    try {
      const data = await mockPlansApi.generatePlan(selectedGoalId);
      setGeneratedPlan(data.plan_content);
      
      toast({
        title: 'Study plan ready!',
        description: 'Your learning journey begins now.',
      });

      setStep('preview');
    } catch (error: any) {
      toast({
        title: 'Failed to generate plan',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
      setStep('select');
    } finally {
      setGenerating(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
        {uploadedFile || step !== 'upload' ? (
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
      
      <div className={`flex items-center gap-2 ${step === 'select' ? 'text-primary' : 'text-muted-foreground'}`}>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          step === 'select' ? 'border-primary' : 'border-muted'
        }`}>
          3
        </div>
        <span className="text-sm font-medium hidden sm:inline">Select</span>
      </div>
      
      <div className="w-12 h-0.5 bg-border" />
      
      <div className={`flex items-center gap-2 ${step === 'generating' || step === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
        {step === 'preview' ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            step === 'generating' ? 'border-primary' : 'border-muted'
          }`}>
            4
          </div>
        )}
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
              <h3 className="text-lg font-semibold mb-2">Upload Study Materials (Optional)</h3>
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
              </div>
            )}
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setStep('goal')}
            >
              Skip <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'goal' && (
          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Set Your Learning Goal</h3>
              <p className="text-sm text-muted-foreground">
                {uploadedFile ? `Define what you want to achieve with ${uploadedFile.file_name}` : 'Define your learning goal'}
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
                    Create Goal <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'select' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Goal</h3>
              <p className="text-sm text-muted-foreground">
                Choose which goal you'd like to generate a study plan for
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading goals...</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No goals found. Please create a goal first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedGoalId === goal.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{goal.title}</h4>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            goal.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                            goal.priority === 'medium' ? 'bg-primary/10 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {goal.priority}
                          </span>
                        </div>
                      </div>
                      {selectedGoalId === goal.id && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('goal')}
                className="flex-1"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleGeneratePlan}
                className="flex-1"
                disabled={!selectedGoalId || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Plan <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
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

        {step === 'preview' && generatedPlan && (
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Your Study Plan
                </h4>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{generatedPlan}</ReactMarkdown>
              </div>
            </div>

            <Button onClick={onComplete} className="w-full">
              <Check className="mr-2 h-4 w-4" />
              Complete Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
