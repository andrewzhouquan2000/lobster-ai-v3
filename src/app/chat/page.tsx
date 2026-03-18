'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

// Message type
interface Message {
  id: number;
  agent: string;
  avatar: string;
  content: string;
  time: string;
  isUser?: boolean;
}

// Agent status type
type AgentStatus = 'waiting' | 'running' | 'completed' | 'paused' | 'cancelled';

// Task control state
interface TaskControlState {
  isPaused: boolean;
  isCancelled: boolean;
}

interface AgentProgress {
  id: number;
  name: string;
  role: string;
  avatar: string;
  status: AgentStatus;
  task: string;
  progress: number;
}

interface LogEntry {
  time: string;
  agent: string;
  action: string;
  type: 'running' | 'success' | 'info';
}

// 初始 Agent 配置（等待状态）
const defaultAgents: AgentProgress[] = [
  { id: 1, name: 'CEO Lobster', role: '任务协调', avatar: '🦞', status: 'waiting', task: '等待任务分配', progress: 0 },
  { id: 2, name: 'Coder Lobster', role: '代码开发', avatar: '💻', status: 'waiting', task: '等待任务分配', progress: 0 },
  { id: 3, name: 'Designer Lobster', role: 'UI/UX', avatar: '🎨', status: 'waiting', task: '等待任务分配', progress: 0 },
  { id: 4, name: 'DevOps Lobster', role: '部署运维', avatar: '⚙️', status: 'waiting', task: '等待任务分配', progress: 0 },
];

// 模拟的 Agent 响应
const agentResponses = [
  { agent: 'CEO', avatar: '🦞', content: '收到！我来分析需求并协调团队。让我先拆解一下任务...', delay: 500 },
  { agent: 'Coder', avatar: '💻', content: '明白，我来评估技术方案。\n\n初步分析：\n1. 需要数据层\n2. 核心逻辑层\n3. 输出层\n\n开始编码...', delay: 1500 },
  { agent: 'Designer', avatar: '🎨', content: '收到需求，我来设计用户界面和交互流程。', delay: 2500 },
  { agent: 'DevOps', avatar: '⚙️', content: '好的，我来准备部署环境和 CI/CD 配置。', delay: 2000 },
];

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNewProject = searchParams.get('new') === 'true';
  const projectName = searchParams.get('name') || '新项目';
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<AgentProgress[]>(defaultAgents);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showProgressPanel, setShowProgressPanel] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasOutputFiles, setHasOutputFiles] = useState(false);
  const [taskControl, setTaskControl] = useState<TaskControlState>({ isPaused: false, isCancelled: false });
  const logContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Get current time in HH:mm format
  const getCurrentTime = useCallback(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  // Add log entry
  const addLog = useCallback((agent: string, action: string, type: 'running' | 'success' | 'info') => {
    setLogs(prev => [{ time: getCurrentTime(), agent, action, type }, ...prev].slice(0, 20));
  }, [getCurrentTime]);

  // Update agent status
  const updateAgentStatus = useCallback((agentId: number, status: AgentStatus, task: string, progress: number) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status, task, progress } : a
    ));
  }, []);

  // Clear all pending timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(t => clearTimeout(t));
    timeoutRefs.current = [];
  }, []);

  // Handle pause task
  const handlePauseTask = useCallback(() => {
    clearAllTimeouts();
    setTaskControl(prev => ({ ...prev, isPaused: true }));
    setAgents(prev => prev.map(a => 
      a.status === 'running' ? { ...a, status: 'paused' as AgentStatus, task: '已暂停 - 等待恢复' } : a
    ));
    addLog('System', '任务已暂停', 'info');
  }, [clearAllTimeouts, addLog]);

  // Handle resume task
  const handleResumeTask = useCallback(() => {
    setTaskControl(prev => ({ ...prev, isPaused: false }));
    setAgents(prev => prev.map(a => 
      a.status === 'paused' ? { ...a, status: 'running' as AgentStatus, task: '继续执行中...' } : a
    ));
    addLog('System', '任务已恢复', 'info');
    // Note: In a real implementation, you would resume the actual task execution here
  }, [addLog]);

  // Handle cancel task
  const handleCancelTask = useCallback(() => {
    clearAllTimeouts();
    setTaskControl({ isPaused: false, isCancelled: true });
    setIsProcessing(false);
    setAgents(prev => prev.map(a => ({ 
      ...a, 
      status: 'cancelled' as AgentStatus, 
      task: '已取消',
      progress: a.status === 'completed' ? a.progress : a.progress 
    })));
    addLog('System', '任务已取消', 'info');
  }, [clearAllTimeouts, addLog]);

  // Handle send message
  const handleSendMessage = () => {
    if (!input.trim() || isProcessing) return;
    
    // Reset task control state for new task
    setTaskControl({ isPaused: false, isCancelled: false });
    
    const userMessage: Message = {
      id: Date.now(),
      agent: 'User',
      avatar: '👤',
      content: input.trim(),
      time: getCurrentTime(),
      isUser: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // 开始 Agent 协作流程
    addLog('System', '收到用户需求，开始分析...', 'info');
    updateAgentStatus(1, 'running', '分析用户需求...', 10);

    // 模拟 Agent 响应序列
    let messageDelay = 800;
    agentResponses.forEach((response, index) => {
      const timeoutId = setTimeout(() => {
        // Check if task was cancelled
        if (taskControl.isCancelled) return;
        
        const newMessage: Message = {
          id: Date.now() + index,
          agent: response.agent,
          avatar: response.avatar,
          content: response.content,
          time: getCurrentTime(),
        };
        setMessages(prev => [...prev, newMessage]);
        
        // 更新对应 Agent 状态
        const agentId = index + 1;
        updateAgentStatus(agentId, 'running', '执行任务中...', 20 + index * 20);
        addLog(response.agent, response.content.split('\n')[0].substring(0, 30) + '...', 'running');
        
        // 最后一个响应后完成
        if (index === agentResponses.length - 1) {
          const completeTimeout = setTimeout(() => {
            // Check if task was cancelled
            setTaskControl(current => {
              if (current.isCancelled) return current;
              
              // 标记完成
              setAgents(prev => prev.map(a => ({ ...a, status: 'completed' as AgentStatus, progress: 100, task: '任务完成' })));
              addLog('CEO', '任务分配完成，团队开始工作', 'success');
              
              // 添加完成提示
              const completionMessage: Message = {
                id: Date.now() + 100,
                agent: 'CEO',
                avatar: '🦞',
                content: '✅ 团队已就绪，开始执行任务！\n\n💡 你可以随时查看 **📁 文件** 页面了解产出文件进度。',
                time: getCurrentTime(),
              };
              setMessages(prev => [...prev, completionMessage]);
              setHasOutputFiles(true);
              setIsProcessing(false);
              return current;
            });
          }, 1000);
          timeoutRefs.current.push(completeTimeout);
        }
      }, messageDelay);
      timeoutRefs.current.push(timeoutId);
      messageDelay += response.delay;
    });
  };

  // Calculate overall progress
  const overallProgress = Math.round(
    agents.reduce((sum, a) => sum + a.progress, 0) / agents.length
  );

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Auto-scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'completed': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'waiting': return 'bg-gray-300';
    }
  };

  const getStatusText = (status: AgentStatus) => {
    switch (status) {
      case 'running': return '执行中';
      case 'completed': return '已完成';
      case 'paused': return '已暂停';
      case 'cancelled': return '已取消';
      case 'waiting': return '等待中';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'running': return '●';
      case 'info': return '→';
      default: return '●';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'running': return 'bg-blue-100 text-blue-600';
      case 'info': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">📁</div>
        <div className="flex-1">
          <h1 className="font-semibold text-[#1A1A2E] text-sm">{isNewProject ? projectName : '股票分析工具'}</h1>
          <p className="text-xs text-gray-400">{agents.filter(a => a.status === 'running').length} 个 Agent 执行中</p>
        </div>
        <button 
          onClick={() => setShowProgressPanel(!showProgressPanel)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${showProgressPanel ? 'bg-[#FF6B3D]/10 text-[#FF6B3D]' : 'bg-gray-50'}`}
        >
          📊
        </button>
        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">⋯</button>
      </div>

      {/* Progress Bar - Always visible */}
      <div className="bg-white px-4 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">总体进度</span>
          <span className="text-xs font-medium text-[#FF6B3D]">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              taskControl.isCancelled ? 'bg-red-400' : 
              taskControl.isPaused ? 'bg-yellow-400' : 
              'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B]'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        
        {/* Task Control Buttons */}
        {isProcessing && (
          <div className="flex items-center justify-end gap-2 mt-2">
            {taskControl.isPaused ? (
              <button
                onClick={handleResumeTask}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
              >
                <span>▶</span>
                <span>继续</span>
              </button>
            ) : (
              <button
                onClick={handlePauseTask}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-full hover:bg-yellow-100 transition-colors"
              >
                <span>⏸</span>
                <span>暂停</span>
              </button>
            )}
            <button
              onClick={handleCancelTask}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
            >
              <span>✕</span>
              <span>取消</span>
            </button>
          </div>
        )}
      </div>

      {/* Agent Status Panel - Collapsible */}
      {showProgressPanel && (
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            {agents.map((agent) => (
              <div 
                key={agent.id}
                className={`relative p-3 rounded-xl border ${
                  agent.status === 'running' 
                    ? 'border-blue-200 bg-blue-50/50' 
                    : agent.status === 'completed'
                    ? 'border-green-200 bg-green-50/50'
                    : agent.status === 'paused'
                    ? 'border-yellow-200 bg-yellow-50/50'
                    : agent.status === 'cancelled'
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-base">
                      {agent.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(agent.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A2E] truncate">{agent.name}</p>
                    <p className="text-[10px] text-gray-400">{getStatusText(agent.status)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 truncate">{agent.task}</p>
                {agent.status !== 'waiting' && agent.status !== 'cancelled' && (
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        agent.status === 'completed' ? 'bg-green-400' : 
                        agent.status === 'paused' ? 'bg-yellow-400' : 
                        'bg-blue-400'
                      }`}
                      style={{ width: `${agent.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Logs Toggle */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-600">实时日志</span>
            </div>
            <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div 
            ref={logContainerRef}
            className="mt-2 max-h-32 overflow-auto bg-gray-900 rounded-lg p-2 text-xs font-mono"
          >
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-800 last:border-0">
                <span className="text-gray-500 w-10 shrink-0">{log.time}</span>
                <span className="text-gray-400 w-14 shrink-0">[{log.agent}]</span>
                <span className="text-gray-300 flex-1">{log.action}</span>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${getLogColor(log.type)}`}>
                  {getLogIcon(log.type)}
                </span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4 pb-24">
        {isNewProject && messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-4xl mb-3">🦞</p>
            <p className="text-sm">开始你的项目吧！</p>
            <p className="text-xs mt-1">输入需求，AI 团队将协助你完成</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.isUser ? 'flex-row-reverse' : ''}`}>
              {!msg.isUser && (
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm shrink-0">
                  {msg.avatar}
                </div>
              )}
              <div className={msg.isUser ? 'text-right' : ''}>
                {!msg.isUser && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">{msg.agent}</p>
                )}
                <div className={`rounded-2xl px-3 py-2 text-sm ${
                  msg.isUser 
                    ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white rounded-tr-md' 
                    : 'bg-white shadow-sm rounded-tl-md'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className={`text-[10px] text-gray-300 mt-1 ${msg.isUser ? 'mr-1' : 'ml-1'}`}>{msg.time}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {/* Output Files Guidance - P1-3 */}
        {hasOutputFiles && (
          <div className="mt-4 p-3 bg-gradient-to-r from-[#FF6B3D]/10 to-[#FF8F6B]/10 rounded-xl border border-[#FF6B3D]/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📁</span>
              <span className="text-sm font-medium text-[#1A1A2E]">产出文件</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">团队正在生成项目文件，点击下方按钮查看进度。</p>
            <Link 
              href="/artifacts" 
              className="inline-flex items-center gap-1 text-xs text-[#FF6B3D] font-medium hover:underline"
            >
              查看文件 →
            </Link>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <span>+</span>
          </button>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input.trim()) {
                handleSendMessage();
              }
            }}
            placeholder="输入消息..."
            className="flex-1 h-9 text-sm bg-gray-50 border-0 rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20"
          />
          <button 
            onClick={handleSendMessage}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
              input.trim() 
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