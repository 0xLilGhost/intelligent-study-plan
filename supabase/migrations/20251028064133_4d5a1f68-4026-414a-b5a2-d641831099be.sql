-- Add category column to study_goals table
ALTER TABLE public.study_goals 
ADD COLUMN IF NOT EXISTS category text;