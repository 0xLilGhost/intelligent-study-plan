-- Create table for daily study content
CREATE TABLE IF NOT EXISTS public.daily_study_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_study_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily content"
ON public.daily_study_content
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily content"
ON public.daily_study_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_daily_content_plan ON public.daily_study_content(plan_id);
CREATE INDEX idx_daily_content_user ON public.daily_study_content(user_id);