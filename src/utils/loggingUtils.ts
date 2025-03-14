
/**
 * Non-blocking system logging utility
 */
export async function logSystemEvent(
  component: string,
  level: 'INFO' | 'ERROR' | 'WARN',
  message: string,
  metadata?: Record<string, any>
) {
  try {
    // Use setTimeout to make this non-blocking
    setTimeout(async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('system_logs').insert({
          component,
          log_level: level,
          message,
          metadata: metadata || {}
        });
      } catch (error) {
        // Just log to console if DB logging fails
        console.error('Failed to write system log:', error);
      }
    }, 0);
  } catch (error) {
    // Fallback to console logging
    console.error('Error in logging system:', error);
  }
}
