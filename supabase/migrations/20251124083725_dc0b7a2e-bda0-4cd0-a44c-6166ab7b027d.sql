-- Add goal_id column to study_files table to link files with goals
ALTER TABLE study_files 
ADD COLUMN goal_id UUID REFERENCES study_goals(id) ON DELETE SET NULL;