-- Enable pg_net for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger function: calls the stock-alert-push Edge Function asynchronously
CREATE OR REPLACE FUNCTION public.notify_stock_alert_push()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://qpykyxeigznotjtykzjw.supabase.co/functions/v1/stock-alert-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFweWt5eGVpZ3pub3RqdHlremp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDY0OTQsImV4cCI6MjA5MjU4MjQ5NH0.Jsj4ZYLeeZ3Ol60znasTr2Y7S-AeLXzfARRqLjrLGPY'
    ),
    body    := jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stock_alert_push
  AFTER INSERT ON public.stock_alerts
  FOR EACH ROW EXECUTE FUNCTION public.notify_stock_alert_push();
