
import { initSupabase } from "../utils.ts";

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export class MonitoringService {
  private static supabase = initSupabase();

  static async trackPerformance(endpoint: string, startTime: number, success: boolean, details: Record<string, unknown> = {}) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    try {
      await this.supabase
        .from('performance_metrics')
        .insert({
          endpoint_name: endpoint,
          response_time: responseTime,
          success,
          details
        });
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  static async trackUsage(featureName: string, actionType: string, userId?: string, details: Record<string, unknown> = {}) {
    try {
      await this.supabase
        .from('usage_stats')
        .insert({
          feature_name: featureName,
          action_type: actionType,
          user_id: userId,
          details
        });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  }

  static async log(level: LogLevel, component: string, message: string, errorCode?: string, error?: Error, metadata: Record<string, unknown> = {}) {
    try {
      await this.supabase
        .from('system_logs')
        .insert({
          log_level: level,
          component,
          message,
          error_code: errorCode,
          stack_trace: error?.stack,
          metadata: {
            ...metadata,
            error_message: error?.message
          }
        });

      // Also log to console for immediate visibility
      const logMessage = `[${level}] ${component}: ${message}`;
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(logMessage, metadata);
          break;
        case LogLevel.INFO:
          console.info(logMessage, metadata);
          break;
        case LogLevel.WARN:
          console.warn(logMessage, metadata);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(logMessage, error, metadata);
          break;
      }
    } catch (logError) {
      console.error('Failed to write to system logs:', logError);
    }
  }
}

// Performance tracking decorator
export function trackPerformance(endpoint: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        await MonitoringService.trackPerformance(endpoint, startTime, true);
        return result;
      } catch (error) {
        await MonitoringService.trackPerformance(endpoint, startTime, false, { error: error.message });
        throw error;
      }
    };

    return descriptor;
  };
}
