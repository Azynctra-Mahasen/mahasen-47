
import { initSupabase } from "../utils.ts";
import { LogLevel } from "./monitoring.ts";

export interface ErrorTrend {
  day: string;
  logLevel: LogLevel;
  errorCount: number;
  affectedComponents: number;
  changePercentage: number | null;
}

export interface PerformanceMetrics {
  timeBucket: string;
  endpointName: string;
  totalRequests: number;
  successfulRequests: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
}

export interface UsageMetrics {
  day: string;
  featureName: string;
  actionType: string;
  usageCount: number;
  uniqueUsers: number;
}

export class AnalyticsService {
  private static supabase = initSupabase();

  static async getErrorTrends(days: number = 7): Promise<ErrorTrend[]> {
    const { data, error } = await this.supabase
      .from('error_trends')
      .select('*')
      .gte('day', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('day', { ascending: false });

    if (error) {
      console.error('Failed to fetch error trends:', error);
      return [];
    }

    return data.map(trend => ({
      day: trend.day,
      logLevel: trend.log_level as LogLevel,
      errorCount: trend.error_count,
      affectedComponents: trend.affected_components,
      changePercentage: trend.change_percentage
    }));
  }

  static async getPerformanceMetrics(hours: number = 24): Promise<PerformanceMetrics[]> {
    const { data, error } = await this.supabase
      .from('performance_summary')
      .select('*')
      .gte('time_bucket', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('time_bucket', { ascending: false });

    if (error) {
      console.error('Failed to fetch performance metrics:', error);
      return [];
    }

    return data.map(metric => ({
      timeBucket: metric.time_bucket,
      endpointName: metric.endpoint_name,
      totalRequests: metric.total_requests,
      successfulRequests: metric.successful_requests,
      avgResponseTime: metric.avg_response_time,
      maxResponseTime: metric.max_response_time,
      minResponseTime: metric.min_response_time,
      successRate: metric.success_rate
    }));
  }

  static async getUsageMetrics(days: number = 7): Promise<UsageMetrics[]> {
    const { data, error } = await this.supabase
      .from('usage_summary')
      .select('*')
      .gte('day', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('day', { ascending: false });

    if (error) {
      console.error('Failed to fetch usage metrics:', error);
      return [];
    }

    return data.map(metric => ({
      day: metric.day,
      featureName: metric.feature_name,
      actionType: metric.action_type,
      usageCount: metric.usage_count,
      uniqueUsers: metric.unique_users
    }));
  }

  static async getSystemHealth(): Promise<{
    totalErrors24h: number;
    criticalErrors24h: number;
    avgResponseTime24h: number;
    successRate24h: number;
  }> {
    // Get error counts
    const { data: errorData, error: errorError } = await this.supabase
      .from('system_logs')
      .select('log_level', { count: 'exact' })
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .in('log_level', ['ERROR', 'CRITICAL']);

    // Get performance metrics
    const { data: perfData, error: perfError } = await this.supabase
      .from('performance_metrics')
      .select('response_time, success')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (errorError || perfError) {
      console.error('Failed to fetch system health metrics:', errorError || perfError);
      return {
        totalErrors24h: 0,
        criticalErrors24h: 0,
        avgResponseTime24h: 0,
        successRate24h: 0
      };
    }

    const criticalErrors = errorData?.filter(e => e.log_level === 'CRITICAL').length || 0;
    const totalErrors = errorData?.length || 0;

    const avgResponseTime = perfData?.length 
      ? perfData.reduce((acc, curr) => acc + curr.response_time, 0) / perfData.length 
      : 0;

    const successRate = perfData?.length
      ? (perfData.filter(p => p.success).length / perfData.length) * 100
      : 0;

    return {
      totalErrors24h: totalErrors,
      criticalErrors24h: criticalErrors,
      avgResponseTime24h: avgResponseTime,
      successRate24h: successRate
    };
  }
}
