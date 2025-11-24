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

type Step = 'upload' | 'goal';

export function SetupWizard({ userId, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
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
      setUploadedFileId(uploaded.id);
      setUploadedFileName(uploaded.file_name);
      toast({
        title: '文件上传成功！',
        description: '现在让我们创建您的学习目标。',
      });
      setStep('goal');
    } catch (error: any) {
      toast({
        title: '上传失败',
        description: error.message || '发生错误',
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
      const newGoal = await mockGoalsApi.createGoal(userId, title, priority);
      
      // If a file was uploaded, link it to the goal
      if (uploadedFileId) {
        await mockFilesApi.linkFileToGoal(uploadedFileId, newGoal.id);
      }
      
      toast({
        title: '目标创建成功！',
        description: uploadedFileId 
          ? '您的目标和文件已成功关联。'
          : '您的学习目标已成功创建。',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: '创建目标失败',
        description: error.message || '发生错误',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };


  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
        {uploadedFileId || step !== 'upload' ? (
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
    </div>
  );

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Sparkles className="h-6 w-6 text-primary" />
          创建学习计划
        </CardTitle>
        <CardDescription>
          上传学习资料并设置目标，获得个性化学习计划
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepIndicator()}

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">上传学习资料（可选）</h3>
              <p className="text-sm text-muted-foreground mb-4">
                添加文档、笔记或其他学习资源
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
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    选择文件
                  </>
                )}
              </Button>
            </label>
            {uploadedFileName && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{uploadedFileName}</span>
                </div>
              </div>
            )}
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setStep('goal')}
            >
              跳过 <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'goal' && (
          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Target className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">设置学习目标</h3>
              <p className="text-sm text-muted-foreground">
                {uploadedFileName ? `定义您使用 ${uploadedFileName} 想要达成的目标` : '定义您的学习目标'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">目标标题</Label>
              <Input
                id="title"
                placeholder="例如：掌握 React Hooks"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Textarea
                id="description"
                placeholder="详细描述您的目标..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  placeholder="例如：前端开发"
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
                <ChevronLeft className="mr-1 h-4 w-4" /> 返回
              </Button>
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    创建目标 <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

      </CardContent>
    </Card>
  );
}
