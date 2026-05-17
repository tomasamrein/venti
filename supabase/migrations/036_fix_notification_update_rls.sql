-- Fix: announcements from super-admin have user_id = NULL.
-- The previous UPDATE policy required user_id = auth.uid(), which never
-- matches NULL, so marking them as read silently did nothing.
-- Allow update when user_id IS NULL and the org belongs to the user.

DROP POLICY IF EXISTS "notif_update" ON notifications;

CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
  OR (user_id IS NULL AND organization_id = ANY(get_user_org_ids()))
);
