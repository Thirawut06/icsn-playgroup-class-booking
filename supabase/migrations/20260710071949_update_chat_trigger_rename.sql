-- Trigger on parents (Name change)
DROP TRIGGER IF EXISTS on_parent_update_notify ON public.parents;
CREATE TRIGGER on_parent_update_notify
  AFTER UPDATE OF name ON public.parents
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION public.trigger_google_chat_notify();

-- Trigger on children (Name change)
DROP TRIGGER IF EXISTS on_child_update_notify ON public.children;
CREATE TRIGGER on_child_update_notify
  AFTER UPDATE OF full_name, nickname ON public.children
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name OR OLD.nickname IS DISTINCT FROM NEW.nickname)
  EXECUTE FUNCTION public.trigger_google_chat_notify();
