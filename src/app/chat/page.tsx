'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { ConnectionStatus, PUBLIC_GATEWAY_URL } from '@/lib/openclaw-client';

// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  agent?: string; // Agent 名称
  isFinal?: boolean; // 是否是最终消息
  metadata?: {
    phase?: string;
    progress?: number;
    deploy_url?: string;
  };
}

// 项目状态
interface ProjectState {
  phase: string;
  progress: number;
  deploy_url: string | null;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project') || searchParams.get('id');
  const projectName = searchParams.get('name') || '新项目';
  const isNewProject = searchParams.get('new') === 'true';
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<ConnectionStatus>('disconnected');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 检查 Gateway 状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/chat');
        if (res.ok) {
          setGatewayStatus('connected');
        } else {
          setGatewayStatus('error');
        }
      } catch {
        setGatewayStatus('error');
      }
    };
    checkStatus();
  }, []);

  // 加载项目状态和初始消息
  useEffect(() => {
    if (!projectId) return;
    
    const loadProjectState = async () => {
      try {
        // 加载项目状态
        const stateRes = await fetch(`/api/project-state?projectId=${projectId}`);
        if (stateRes.ok) {
          const data = await stateRes.json();
          
          if (data.state) {
            setProjectState({
              phase: data.state.phase,
              progress: data.state.progress,
              deploy_url: data.state.deploy_url,
            });
          }
        }

        // 加载历史消息
        const messagesRes = await fetch(`/api/projects/${projectId}/messages`);
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          if (data.messages && data.messages.length > 0) {
            const loadedMessages: Message[] = data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              agent: msg.metadata?.agent,
              metadata: msg.metadata,
            }));
            setMessages(loadedMessages);
          }
        }
      } catch (error) {
        console.error('Load project state error:', error);
      }
    };
    
    loadProjectState();
  }, [projectId, isNewProject]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 获取当前时间
  const getCurrentTime = useCallback(() => {
    return new Date().toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // 发送消息到 Agent 协作系统
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userContent = input.trim();
    
    // 添加用户消息到 UI
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userContent,
      time: getCurrentTime(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 调用统一的 Chat API（支持完整 Agent 协作流程）
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: userContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.success && data.messages) {
          // 处理多 Agent 消息
          for (const msg of data.messages) {
            // 添加延迟效果，让消息逐个出现
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const agentMessage: Message = {
              id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              role: 'assistant',
              content: msg.content,
              time: getCurrentTime(),
              agent: msg.agent,
              isFinal: msg.isFinal,
              metadata: msg.isFinal && data.state ? {
                phase: data.state.phase,
                progress: data.state.progress,
                deploy_url: data.state.deploy_url,
              } : undefined,
            };
            
            setMessages(prev => [...prev, agentMessage]);
          }

          // 更新项目状态
          if (data.state) {
            setProjectState(data.state);
          }
        } else if (data.choices) {
          // 兼容 OpenAI 格式响应
          const content = data.choices?.[0]?.message?.content || '无法获取响应';
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content,
            time: getCurrentTime(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // 错误处理
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: data.error || '处理失败，请重试。',
            time: getCurrentTime(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        throw new Error('Chat API failed');
      }
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '网络错误，请检查连接后重试。',
        time: getCurrentTime(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // 状态显示
  const getStatusDisplay = () => {
    switch (gatewayStatus) {
      case 'connected':
        return { color: 'bg-green-500', text: 'OpenClaw 已连接' };
      case 'connecting':
        return { color: 'bg-yellow-500', text: '连接中...' };
      case 'error':
        return { color: 'bg-red-500', text: '连接错误' };
      default:
        return { color: 'bg-gray-400', text: '未连接' };
    }
  };

  const statusDisplay = getStatusDisplay();

  // 阶段显示
  const getPhaseDisplay = () => {
    if (!projectState) return null;
    
    const phaseMap: Record<string, { icon: string; text: string; color: string }> = {
      init: { icon: '🚀', text: '初始化', color: 'bg-blue-100 text-blue-700' },
      requirement: { icon: '📝', text: '需求收集', color: 'bg-purple-100 text-purple-700' },
      planning: { icon: '📋', text: '规划中', color: 'bg-yellow-100 text-yellow-700' },
      development: { icon: '💻', text: '开发中', color: 'bg-orange-100 text-orange-700' },
      deploying: { icon: '🚢', text: '部署中', color: 'bg-indigo-100 text-indigo-700' },
      completed: { icon: '✅', text: '已完成', color: 'bg-green-100 text-green-700' },
    };
    
    const phase = phaseMap[projectState.phase] || phaseMap.init;
    
    return (
      <div className={`px-2 py-1 rounded-full text-xs ${phase.color}`}>
        {phase.icon} {phase.text}
        {projectState.progress > 0 && projectState.progress < 100 && (
          <span className="ml-1">({projectState.progress}%)</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-[#1A1A2E] text-sm">{projectName}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
              <span className="text-xs text-gray-400">{statusDisplay.text}</span>
            </div>
            {getPhaseDisplay()}
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">⋯</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4 pb-36">
        {/* 欢迎消息 */}
        {isNewProject && messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-4xl mb-3">🦞</p>
            <p className="text-sm">开始你的项目吧！</p>
            <p className="text-xs mt-1">CEO AI 正在准备...</p>
          </div>
        )}

        {/* 连接警告 */}
        {gatewayStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <p className="font-medium">⚠️ 无法连接到 OpenClaw Gateway</p>
            <p className="text-xs mt-1">请确保 Gateway 正在运行：{PUBLIC_GATEWAY_URL}</p>
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
              {/* Agent 名称标签 */}
              {msg.agent && (
                <div className="flex items-center gap-1 mb-1 ml-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    msg.agent.includes('CEO') 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {msg.agent.includes('CEO') ? '👔' : '💻'} {msg.agent}
                  </span>
                </div>
              )}
              <div className={`rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white rounded-tr-md'
                  : 'bg-white shadow-sm rounded-tl-md'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                
                {/* 部署链接 - 突出显示 */}
                {msg.metadata?.deploy_url && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <a 
                      href={msg.metadata.deploy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <span>🔗</span>
                      <span>查看项目预览</span>
                      <span>→</span>
                    </a>
                  </div>
                )}
              </div>
              <p className={`text-[10px] text-gray-300 mt-1 ${msg.role === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        
        {/* 加载指示器 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm rounded-2xl rounded-tl-md px-3 py-2">
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷提示 */}
      {messages.length <= 1 && gatewayStatus === 'connected' && !isLoading && (
        <div className="px-4 py-2 border-t border-gray-100 bg-white">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setInput('帮我创建一个24点游戏应用')}
              className="shrink-0 px-3 py-1.5 text-xs bg-orange-50 text-[#FF6B3D] rounded-full hover:bg-orange-100 transition-colors"
            >
              🎮 24点游戏
            </button>
            <button 
              onClick={() => setInput('帮我创建一个企业官网')}
              className="shrink-0 px-3 py-1.5 text-xs bg-orange-50 text-[#FF6B3D] rounded-full hover:bg-orange-100 transition-colors"
            >
              🌐 企业官网
            </button>
            <button 
              onClick={() => setInput('帮我创建一个数据分析仪表盘')}
              className="shrink-0 px-3 py-1.5 text-xs bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition-colors"
            >
              📊 数据仪表盘
            </button>
          </div>
        </div>
      )}

      {/* 输入框 */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea 
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder={gatewayStatus === 'connected' ? "描述你的需求... (Shift+Enter换行)" : "等待连接..."}
              rows={1}
              disabled={isLoading}
              className="w-full text-sm bg-gray-50 border-0 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20 resize-none min-h-[36px] max-h-[120px] overflow-y-auto disabled:opacity-50"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white shadow-md'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <span>→</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}