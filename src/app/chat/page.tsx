'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

const initialMessages: Message[] = [
  { id: 1, agent: 'CEO', avatar: '🦞', content: '收到，我来安排开发任务。Coder，请开始实现股票分析工具。', time: '14:30' },
  { id: 2, agent: 'Coder', avatar: '💻', content: '好的，我来分析需求并开始编写代码。\n\n预计需要以下模块：\n1. 数据获取层\n2. 分析引擎\n3. 报告生成', time: '14:32' },
  { id: 3, agent: 'User', avatar: '👤', content: '好的，开始吧', time: '14:35', isUser: true },
  { id: 4, agent: 'Coder', avatar: '💻', content: '✅ 数据获取模块已完成\n```python\ndef get_stock_price(symbol):\n    return fetch_data(symbol)\n```', time: '14:45' },
  { id: 5, agent: 'DevOps', avatar: '⚙️', content: '我已创建 OSS bucket，准备部署', time: '14:50' },
];

// Agent status type
type AgentStatus = 'waiting' | 'running' | 'completed';

interface AgentProgress {
  id: number;
  name: string;
  role: string;
  avatar: string;
  status: AgentStatus;
  task: string;
  progress: number;
}

const initialAgents: AgentProgress[] = [
  { id: 1, name: 'CEO Lobster', role: '任务协调', avatar: '🦞', status: 'completed', task: '需求分析与任务分配', progress: 100 },
  { id: 2, name: 'Coder Lobster', role: '代码开发', avatar: '💻', status: 'running', task: '实现数据获取模块...', progress: 65 },
  { id: 3, name: 'Designer Lobster', role: 'UI/UX', avatar: '🎨', status: 'waiting', task: '等待设计需求', progress: 0 },
  { id: 4, name: 'DevOps Lobster', role: '部署运维', avatar: '⚙️', status: 'waiting', task: '等待代码完成', progress: 0 },
];

const logs = [
  { time: '14:52', agent: 'Coder', action: '正在编写 analyzer.py...', type: 'running' },
  { time: '14:50', agent: 'DevOps', action: '创建 OSS bucket 完成', type: 'success' },
  { time: '14:48', agent: 'Coder', action: '数据获取模块开发中', type: 'info' },
  { time: '14:45', agent: 'Coder', action: '完成 fetch_data.py', type: 'success' },
  { time: '14:42', agent: 'CEO', action: '任务已分配给团队', type: 'success' },
  { time: '14:40', agent: 'CEO', action: '分析需求中...', type: 'info' },
];

function ChatContent() {
  const searchParams = useSearchParams();
  const isNewProject = searchParams.get('new') === 'true';
  const projectName = searchParams.get('name') || '新项目';
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [agents, setAgents] = useState<AgentProgress[]>(initialAgents);
  const [showProgressPanel, setShowProgressPanel] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current time in HH:mm format
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      agent: 'User',
      avatar: '👤',
      content: input.trim(),
      time: getCurrentTime(),
      isUser: true,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  // Calculate overall progress
  const overallProgress = Math.round(
    agents.reduce((sum, a) => sum + a.progress, 0) / agents.length
  );

  // Simulate progress updates
  useEffect(() => {
    if (isNewProject) {
      // Reset agents for new project
      setAgents(agents.map(a => ({ ...a, status: 'waiting' as AgentStatus, progress: 0, task: '等待任务分配' })));
    }
  }, [isNewProject]);

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

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'completed': return 'bg-green-500';
      case 'waiting': return 'bg-gray-300';
    }
  };

  const getStatusText = (status: AgentStatus) => {
    switch (status) {
      case 'running': return '执行中';
      case 'completed': return '已完成';
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
            className="h-full bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
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
                {agent.status !== 'waiting' && (
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        agent.status === 'completed' ? 'bg-green-400' : 'bg-blue-400'
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