import { useState } from 'react';
import { mockFilesApi } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  userId: string;
  onUploadSuccess: () => void;
}

export function FileUpload({ userId, onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // TODO: Replace with actual file upload API call
      await mockFilesApi.uploadFile(userId, file);

      toast({
        title: 'File uploaded!',
        description: 'Your study material has been saved.',
      });
      onUploadSuccess();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Upload Study Materials
        </CardTitle>
        <CardDescription>Add documents, notes, or any learning resources</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
