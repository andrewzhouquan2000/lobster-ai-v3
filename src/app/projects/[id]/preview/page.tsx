'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 24点游戏组件
function Game24() {
  const [cards, setCards] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // 生成4个随机数字（1-13）
  const generateCards = () => {
    const newCards = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
    setCards(newCards);
    setInput('');
    setResult(null);
  };

  // 检查答案
  const checkAnswer = () => {
    if (!input.trim()) {
      setResult('请输入表达式');
      return;
    }

    setAttempts(prev => prev + 1);

    try {
      // 简单验证：检查是否使用了所有4个数字
      const usedNumbers = input.match(/\d+/g)?.map(Number) || [];
      const sortedUsed = [...usedNumbers].sort((a, b) => a - b);
      const sortedCards = [...cards].sort((a, b) => a - b);

      if (sortedUsed.length !== 4 || sortedUsed.join(',') !== sortedCards.join(',')) {
        setResult('必须使用全部4个数字，每个只能用一次！');
        return;
      }

      // 计算表达式结果
      // 替换 × 和 ÷
      let expr = input.replace(/×/g, '*').replace(/÷/g, '/');
      const evalResult = eval(expr);

      if (Math.abs(evalResult - 24) < 0.0001) {
        setResult('🎉 正确！答案等于24！');
        setScore(prev => prev + 1);
      } else {
        setResult(`❌ 结果是 ${evalResult.toFixed(2)}，不是24`);
      }
    } catch {
      setResult('表达式格式错误，请检查');
    }
  };

  useEffect(() => {
    generateCards();
  }, []);

  const cardSymbols = ['♠', '♥', '♦', '♣'];
  const cardColors = ['text-black', 'text-red-500', 'text-red-500', 'text-black'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-md mx-auto">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🎴 24点游戏</h1>
          <p className="text-green-200 text-sm">使用四个数字和运算符，计算得到24</p>
        </div>

        {/* 分数 */}
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{score}</div>
            <div className="text-xs text-green-200">得分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{attempts}</div>
            <div className="text-xs text-green-200">尝试</div>
          </div>
        </div>

        {/* 卡片 */}
        <div className="flex justify-center gap-3 mb-6">
          {cards.map((num, i) => (
            <div key={i} className="bg-white rounded-xl w-16 h-24 flex flex-col items-center justify-center shadow-lg">
              <span className={`text-2xl ${cardColors[i % 4]}`}>{cardSymbols[i % 4]}</span>
              <span className="text-2xl font-bold text-gray-800">{num}</span>
            </div>
          ))}
        </div>

        {/* 输入框 */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            placeholder="输入表达式，如: (6+2)×(5-2)"
            className="w-full bg-white rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setInput(prev => prev + '+')}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold"
            >
              +
            </button>
            <button
              onClick={() => setInput(prev => prev + '-')}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold"
            >
              −
            </button>
            <button
              onClick={() => setInput(prev => prev + '×')}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold"
            >
              ×
            </button>
            <button
              onClick={() => setInput(prev => prev + '÷')}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold"
            >
              ÷
            </button>
            <button
              onClick={() => setInput(prev => prev + '(')}
              className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-bold"
            >
              (
            </button>
            <button
              onClick={() => setInput(prev => prev + ')')}
              className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-bold"
            >
              )
            </button>
          </div>
        </div>

        {/* 结果 */}
        {result && (
          <div className={`text-center p-3 rounded-lg mb-4 ${
            result.includes('正确') ? 'bg-green-500 text-white' : 'bg-red-500/80 text-white'
          }`}>
            {result}
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={checkAnswer}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 rounded-xl shadow-lg transition-colors"
          >
            ✓ 提交答案
          </button>
          <button
            onClick={generateCards}
            className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
          >
            🔄 换一题
          </button>
        </div>

        {/* 提示 */}
        <div className="mt-6 text-center">
          <p className="text-green-200 text-xs">
            提示：使用 + − × ÷ 和括号，使结果等于24
          </p>
        </div>
      </div>
    </div>
  );
}

// 默认项目预览
function DefaultPreview({ projectId }: { projectId: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🦞</div>
        <h1 className="text-2xl font-bold text-white mb-2">项目预览</h1>
        <p className="text-gray-400 mb-6">项目 ID: {projectId}</p>
        <div className="bg-gray-700 rounded-xl p-6 max-w-md">
          <p className="text-gray-300 text-sm">
            这个项目正在开发中或还没有设置预览内容。
            <br /><br />
            如果这是一个游戏项目，请访问正确的预览链接。
          </p>
        </div>
      </div>
    </div>
  );
}

// 预览内容
function PreviewContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project') || searchParams.get('id');
  const type = searchParams.get('type') || 'game';

  // 根据项目类型渲染不同的预览
  if (type === 'game' || type === 'game24') {
    return <Game24 />;
  }

  return <DefaultPreview projectId={projectId || 'unknown'} />;
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}