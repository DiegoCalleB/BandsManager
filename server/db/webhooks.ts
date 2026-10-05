import { getSupabase } from "./core.js";

// In-memory fallback for webhook events
const inMemoryWebhookEvents = new Set<string>();

export async function dbIsWebhookEventProcessed(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  if (inMemoryWebhookEvents.has(eventId)) return true;

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('stripe_webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (!error && data?.event_id) {
      inMemoryWebhookEvents.add(eventId);
      return true;
    }
  } catch (e) {
    // If table doesn't exist yet, in-memory check is used
  }

  return false;
}

export async function dbRecordWebhookEvent(eventId: string, eventType: string, payload?: any): Promise<void> {
  if (!eventId) return;
  inMemoryWebhookEvents.add(eventId);

  try {
    const sb = getSupabase();
    await sb
      .from('stripe_webhook_events')
      .upsert({
        event_id: eventId,
        event_type: eventType,
        payload: payload || {},
        processed_at: new Date().toISOString()
      }, { onConflict: 'event_id' });
  } catch (e) {
    // Non-blocking if table doesn't exist
  }
}

