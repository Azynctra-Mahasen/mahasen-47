
import { createClient } from '@supabase/supabase-js';

// Error handling utilities
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// Logging utility
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
  }
};

// Supabase client initialization
export const initSupabase = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new MCPError(
      'Missing Supabase configuration',
      'CONFIG_ERROR'
    );
  }

  return createClient(supabaseUrl, supabaseKey);
};

// Response formatting utility
export const formatResponse = (data: any, error?: Error) => {
  if (error) {
    return {
      success: false,
      error: error instanceof MCPError ? error : new MCPError(
        error.message,
        'INTERNAL_ERROR'
      )
    };
  }
  return {
    success: true,
    data
  };
};
