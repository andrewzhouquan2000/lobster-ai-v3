/**
 * Lobster AI V2 - 阿里云 FC Handler
 * 适配 Next.js standalone 模式
 */

// Next.js standalone server
let nextServer;

/**
 * 初始化 Next.js server
 */
async function initNextServer() {
  if (!nextServer) {
    // standalone 模式下，直接使用 server.js
    const path = require('path');
    const serverPath = path.join(__dirname, 'server.js');
    
    // 删除 cache 确保重新加载
    delete require.cache[require.resolve(serverPath)];
    
    // 加载 Next.js standalone server
    nextServer = require(serverPath);
  }
  return nextServer;
}

/**
 * FC HTTP Handler
 * @param {object} req - FC 请求对象
 * @param {object} resp - FC 响应对象
 * @param {object} context - FC 上下文
 */
exports.handler = async (req, resp, context) => {
  const logger = context.logger;
  
  try {
    // 获取请求信息
    const method = req.method || 'GET';
    const path = req.path || '/';
    const headers = req.headers || {};
    const queries = req.queries || {};
    const body = req.body;
    
    logger.info(`[FC Handler] ${method} ${path}`);
    
    // 健康检查
    if (path === '/health' || path === '/api/health') {
      resp.setStatusCode(200);
      resp.setHeader('Content-Type', 'application/json');
      resp.send(JSON.stringify({ 
        status: 'ok', 
        service: 'lobster-ai-v2',
        version: '0.2.0',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // 初始化 Next.js server
    const server = await initNextServer();
    
    // FC 请求转换为 Node.js IncomingMessage 格式
    // 这里需要适配 FC 的请求格式到 Next.js server
    // 由于 FC 3.0 使用 custom runtime，我们直接代理请求
    
    // 简化处理：返回占位响应
    // 实际生产环境需要使用 @serverless-devs/fc3-adapt 或类似适配器
    resp.setStatusCode(200);
    resp.setHeader('Content-Type', 'text/html; charset=utf-8');
    resp.send(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lobster AI V2</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
          }
          h1 { font-size: 3rem; margin-bottom: 0.5rem; }
          p { opacity: 0.9; }
          .status { 
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🦞 Lobster AI V2</h1>
          <p>阿里云 FC 部署成功</p>
          <div class="status">
            <strong>Status:</strong> Running<br>
            <strong>Region:</strong> cn-hangzhou<br>
            <strong>Time:</strong> ${new Date().toISOString()}
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    logger.error('[FC Handler] Error:', error);
    
    resp.setStatusCode(500);
    resp.setHeader('Content-Type', 'application/json');
    resp.send(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }));
  }
};