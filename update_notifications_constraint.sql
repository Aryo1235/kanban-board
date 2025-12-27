-- Update foreign key constraint for notifications table to handle task deletion
-- Run this if you already created the notifications table without ON DELETE SET NULL

-- Drop existing constraint
ALTER TABLE public.notifications DROP CONSTRAINT notifications_task_id_fkey;

-- Add new constraint with ON DELETE SET NULL
ALTER TABLE public.notifications ADD CONSTRAINT notifications_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;