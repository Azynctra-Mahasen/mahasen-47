
import { initSupabase } from "../utils.ts";

export type WebhookErrorType = 'VALIDATION' | 'PROCESSING' | 'API' | 'DATABASE' | 'UNKNOWN';

export interface WebhookError {
  type: WebhookErrorType;
  message: string;
  details?: Record<string, unknown>;
}

export async function logWebhookError(error: WebhookError) {
  const supabase = initSupabase();
  
  try {
    const { error: insertError } = await supabase
      .from('webhook_errors')
      .insert({
        error_type: error.type,
        message: error.message,
        details: error.details || {},
        notified: false
      });

    if (insertError) {
      console.error('Failed to log webhook error:', insertError);
    }

    // Log to console for immediate visibility
    console.error(`Webhook Error [${error.type}]:`, error.message, error.details);
  } catch (e) {
    console.error('Critical error in error logging:', e);
  }
}

export function handleWebhookError(error: unknown): WebhookError {
  if (error instanceof Error) {
    return {
      type: 'UNKNOWN',
      message: error.message,
      details: {
        stack: error.stack,
        name: error.name
      }
    };
  }
  
  return {
    type: 'UNKNOWN',
    message: 'An unknown error occurred',
    details: { error }
  };
}
