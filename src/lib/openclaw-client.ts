/**
 * OpenClaw Gateway Client
 * 使用 HTTP API 发送消息，WebSocket 用于状态监控
 */

// Gateway URLs
const GATEWAY_WS_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_WS || 'ws://127.0.0.1:18789';
const GATEWAY_HTTP_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || '';

// 导出 Gateway URL（用于显示）
export const PUBLIC_GATEWAY_URL = GATEWAY_HTTP_URL;

export interface OpenClawMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenClawEvent {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'complete' | 'error';
  content?: string;
}

export interface OpenClawResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type StatusCallback = (status: ConnectionStatus) => void;
export type EventCallback = (event: OpenClawEvent) => void;

/**
 * OpenClaw Client - HTTP + WebSocket 混合模式
 */
export class OpenClawClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private statusCallbacks: Set<StatusCallback> = new Set();
  private eventCallbacks: Set<EventCallback> = new Set();
  private reconnectAttempts = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  /**
   * 发送 connect 请求
   */
  private sendConnect(): void {
    const connectMsg = {
      type: 'req',
      id: 'connect-' + Date.now(),
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'webchat',
          version: '1.0.0',
          platform: 'web',
          mode: 'webchat'
        },
        auth: GATEWAY_TOKEN ? { token: GATEWAY_TOKEN } : undefined
      }
    };
    
    console.log('[OpenClaw] Sending connect with token:', !!GATEWAY_TOKEN);
    this.ws?.send(JSON.stringify(connectMsg));
  }

  /**
   * 连接到 Gateway（WebSocket 用于状态监控）
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setStatus('connecting');
    
    try {
      this.ws = new WebSocket(GATEWAY_WS_URL);
      
      this.ws.onopen = () => {
        console.log('[OpenClaw] WebSocket connected');
        this.sendConnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'res' && data.id?.startsWith('connect-')) {
            if (data.ok) {
              console.log('[OpenClaw] Connection established');
              this.setStatus('connected');
              this.reconnectAttempts = 0;
            } else {
              console.error('[OpenClaw] Connect failed:', data.err || data.error);
            }
            return;
          }
          
          if (data.type === 'event') {
            this.eventCallbacks.forEach(cb => cb({
              type: data.event,
              content: data.payload?.text || data.payload?.content
            }));
          }
        } catch (err) {
          console.error('[OpenClaw] Parse error:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[OpenClaw] WebSocket error:', error);
        this.setStatus('error');
      };

      this.ws.onclose = () => {
        console.log('[OpenClaw] WebSocket closed');
        this.setStatus('disconnected');
        
        if (this.reconnectAttempts < 5) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 2000);
        }
      };
    } catch (error) {
      console.error('[OpenClaw] Connection failed:', error);
      this.setStatus('error');
    }
  }

  /**
 * 发送消息 - 使用 API 代理（避免 CORS 问题）
   */
  async sendMessage(message: string): Promise<OpenClawResponse> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'default',
          messages: [{ role: 'user', content: message }],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OpenClaw] API error:', response.status, errorData);
        return { success: false, error: `HTTP ${response.status}: ${errorData.error || 'Unknown error'}` };
      }

      const data = await response.json();
      
      // 解析 OpenAI 格式的响应
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        return { success: true, content };
      } else {
        return { success: false, error: 'No response content' };
      }
    } catch (error) {
      console.error('[OpenClaw] Send message error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * 订阅状态变化
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    callback(this.status);
    return () => this.statusCallbacks.delete(callback);
  }

  /**
   * 订阅事件
   */
  onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  /**
   * 获取当前状态
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusCallbacks.forEach(cb => cb(status));
  }
}

// 单例
let clientInstance: OpenClawClient | null = null;

export function getOpenClawClient(): OpenClawClient {
  if (!clientInstance) {
    clientInstance = new OpenClawClient();
  }
  return clientInstance;
}