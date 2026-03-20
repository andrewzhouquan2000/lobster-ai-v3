/**
 * 简单测试 - 验证 Agent 协作流程
 */

// 测试 LLM 调用
async function testLlm() {
  const GATEWAY_URL = 'http://127.0.0.1:18789';
  const GATEWAY_TOKEN = '98a0be2c46a2ef8ebcbbe8713e7545ad1705f1d0bb388f11';

  console.log('测试 LLM 代码生成...');
  
  const prompt = `请生成一个简单的 Next.js 计数器页面，使用 TypeScript 和 Tailwind CSS。

要求：
1. 显示当前计数
2. 有增加和减少按钮
3. 样式美观

请使用以下格式输出代码：

\`\`\`file:src/app/page.tsx
// 代码内容
\`\`\``;

  try {
    const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: '你是一位资深前端工程师，擅长 React 和 Next.js。' },
          { role: 'user', content: prompt }
        ],
        stream: false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log('✅ LLM 响应成功\n');
      console.log('生成的代码:');
      console.log('='.repeat(50));
      console.log(content);
      console.log('='.repeat(50));
      
      // 解析文件
      const fileMatch = content.match(/```file:([^\n]+)\n([\s\S]*?)```/);
      if (fileMatch) {
        console.log('\n✅ 检测到文件格式:');
        console.log('  文件路径:', fileMatch[1]);
        console.log('  代码行数:', fileMatch[2].split('\n').length);
      }
      
      return true;
    } else {
      console.log('❌ LLM 响应错误:', res.status);
      return false;
    }
  } catch (error) {
    console.log('❌ 测试失败:', error);
    return false;
  }
}

// 测试文件解析
function testFileParsing() {
  const sampleResponse = `好的，我来帮你创建一个计数器应用。

\`\`\`file:src/app/page.tsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">计数器</h1>
      <p className="text-6xl mb-8">{count}</p>
      <div className="flex gap-4">
        <button onClick={() => setCount(c => c - 1)}>-</button>
        <button onClick={() => setCount(c => c + 1)}>+</button>
      </div>
    </div>
  );
}
\`\`\`

\`\`\`file:package.json
{
  "name": "counter-app",
  "version": "1.0.0"
}
\`\`\`
`;

  console.log('\n测试文件解析...');
  
  const fileRegex = /```file:([^\n]+)\n([\s\S]*?)```/g;
  const files = [];
  let match;
  
  while ((match = fileRegex.exec(sampleResponse)) !== null) {
    files.push({
      path: match[1].trim(),
      content: match[2].trim(),
    });
  }
  
  console.log(`✅ 解析到 ${files.length} 个文件:`);
  files.forEach(f => {
    console.log(`  - ${f.path} (${f.content.length} 字符)`);
  });
  
  return files.length === 2;
}

async function main() {
  console.log('====================================');
  console.log('  Agent 协作流程测试');
  console.log('====================================\n');

  // 1. 测试文件解析
  const parseOk = testFileParsing();
  
  // 2. 测试 LLM
  const llmOk = await testLlm();

  console.log('\n====================================');
  console.log('  测试结果');
  console.log('====================================');
  console.log(`文件解析: ${parseOk ? '✅ 通过' : '❌ 失败'}`);
  console.log(`LLM 调用: ${llmOk ? '✅ 通过' : '❌ 失败'}`);
  
  if (parseOk && llmOk) {
    console.log('\n🎉 所有测试通过！Agent 协作流程已准备就绪。');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查配置。');
  }
}

main().catch(console.error);