
import { initSupabase } from "../utils.ts";
import { MonitoringService, LogLevel } from "./monitoring.ts";

export type WebhookErrorType = 'VALIDATION' | 'PROCESSING' | 'API' | 'DATABASE' | 'UNKNOWN';

export interface WebhookError {
  type: WebhookErrorType;
  message: string;
  details?: Record<string, unknown>;
}

export async function logWebhookError(error: WebhookError) {
  const supabase = initSupabase();
  
  try {
    // Log to webhook_errors table for webhook-specific tracking
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

    // Log to system_logs for comprehensive error tracking
    await MonitoringService.log(
      LogLevel.ERROR,
      'webhook',
      error.message,
      error.type,
      undefined,
      error.details
    );
  } catch (e) {
    console.error('Critical error in error logging:', e);
    // Attempt to log the meta-error
    await MonitoringService.log(
      LogLevel.CRITICAL,
      'error-handler',
      'Failed to log webhook error',
      'ERROR_LOGGING_FAILURE',
      e instanceof Error ? e : new Error(String(e))
    );
  }
}

export function handleWebhookError(error: unknown): WebhookError {
  if (error instanceof Error) {
    // Log the error to monitoring system
    MonitoringService.log(
      LogLevel.ERROR,
      'webhook',
      error.message,
      'WEBHOOK_ERROR',
      error
    ).catch(console.error);

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
