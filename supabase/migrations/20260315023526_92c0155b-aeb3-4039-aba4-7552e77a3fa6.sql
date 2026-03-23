
-- Fix overly permissive RLS on response_evaluations
DROP POLICY "Service role manages evaluations" ON public.response_evaluations;

-- Only allow reading own evaluations (service role bypasses RLS for writes)
CREATE POLICY "Users can view evaluations for own conversations"
  ON public.response_evaluations FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
    )
  );
