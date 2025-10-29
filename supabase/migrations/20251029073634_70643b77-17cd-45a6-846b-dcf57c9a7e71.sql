-- Add completed field to daily_study_content for progress tracking
ALTER TABLE daily_study_content
ADD COLUMN completed BOOLEAN DEFAULT false;

-- Add RLS policy to allow users to update their own daily content completion status
CREATE POLICY "Users can update their own daily content"
ON daily_study_content
FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for better query performance
CREATE INDEX idx_daily_content_plan_id ON daily_study_content(plan_id);
CREATE INDEX idx_study_plans_goal_id ON study_plans(goal_id);