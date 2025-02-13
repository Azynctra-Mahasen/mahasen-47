
import { logger } from "./utils.ts";

export interface ConnectionState {
  id: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastPing: number;
  reconnectAttempts: number;
  transport: string;
}

export class ConnectionManager {
  private static readonly MAX_RECONNECT_ATTEMPTS = 5;
  private static readonly PING_INTERVAL = 30000; // 30 seconds
  private static readonly CONNECTION_TIMEOUT = 45000; // 45 seconds
  private connections: Map<string, ConnectionState>;
  private pingIntervals: Map<string, number>;

  constructor() {
    this.connections = new Map();
    this.pingIntervals = new Map();
  }

  public addConnection(connectionId: string, transport: string): ConnectionState {
    const state: ConnectionState = {
      id: connectionId,
      status: 'connecting',
      lastPing: Date.now(),
      reconnectAttempts: 0,
      transport
    };
    
    this.connections.set(connectionId, state);
    this.setupPingInterval(connectionId);
    
    logger.info(`New connection added: ${connectionId}`);
    return state;
  }

  private setupPingInterval(connectionId: string) {
    // Clear any existing interval
    if (this.pingIntervals.has(connectionId)) {
      clearInterval(this.pingIntervals.get(connectionId));
    }

    const intervalId = setInterval(() => {
      this.checkConnection(connectionId);
    }, ConnectionManager.PING_INTERVAL);

    this.pingIntervals.set(connectionId, intervalId);
  }

  private async checkConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const timeSinceLastPing = Date.now() - connection.lastPing;
    
    if (timeSinceLastPing > ConnectionManager.CONNECTION_TIMEOUT) {
      if (connection.status === 'connected') {
        logger.warn(`Connection ${connectionId} timed out. Attempting reconnect...`);
        await this.handleDisconnect(connectionId);
      }
    }
  }

  public async handleDisconnect(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    connection.status = 'disconnected';
    
    if (connection.reconnectAttempts < ConnectionManager.MAX_RECONNECT_ATTEMPTS) {
      return await this.attemptReconnect(connectionId);
    } else {
      logger.error(`Max reconnection attempts reached for ${connectionId}`);
      this.removeConnection(connectionId);
      return false;
    }
  }

  private async attemptReconnect(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    connection.status = 'reconnecting';
    connection.reconnectAttempts++;

    try {
      // Exponential backoff for reconnect attempts
      const backoffTime = Math.min(1000 * Math.pow(2, connection.reconnectAttempts - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));

      connection.status = 'connected';
      connection.lastPing = Date.now();
      logger.info(`Successfully reconnected ${connectionId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to reconnect ${connectionId}:`, error);
      return false;
    }
  }

  public updatePing(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastPing = Date.now();
      if (connection.status !== 'connected') {
        connection.status = 'connected';
        logger.info(`Connection ${connectionId} is now active`);
      }
    }
  }

  public removeConnection(connectionId: string) {
    if (this.pingIntervals.has(connectionId)) {
      clearInterval(this.pingIntervals.get(connectionId));
      this.pingIntervals.delete(connectionId);
    }
    
    this.connections.delete(connectionId);
    logger.info(`Connection removed: ${connectionId}`);
  }

  public getConnectionState(connectionId: string): ConnectionState | undefined {
    return this.connections.get(connectionId);
  }
}

export const connectionManager = new ConnectionManager();
