-- Update trigger on parents to include phone changes
DROP TRIGGER IF EXISTS on_parent_update_notify ON public.parents;
CREATE TRIGGER on_parent_update_notify
  AFTER UPDATE OF name, phone ON public.parents
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.phone IS DISTINCT FROM NEW.phone)
  EXECUTE FUNCTION public.trigger_google_chat_notify();
