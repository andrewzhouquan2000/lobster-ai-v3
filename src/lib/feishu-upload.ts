/**
 * 飞书云存储上传封装
 * 用于将文件上传到飞书云空间并返回可访问链接
 */

// 飞书 API 配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a927a7f0fd78dccb';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'tasCPDtFwWCXwN4eIS4KSdCci7IzXBjw';

// 默认上传目标文档（用于存储项目产出文件）
const DEFAULT_DOC_TOKEN = 'XtN7dC0TUo6jTexqjmhc45CPnHc';

// 缓存 tenant_access_token
let cachedToken: string | null = null;
let tokenExpireTime = 0;

interface UploadResult {
  success: boolean;
  fileToken?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  downloadUrl?: string;
  error?: string;
}

interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

/**
 * 获取飞书 tenant_access_token
 */
async function getTenantAccessToken(): Promise<string> {
  // 如果有缓存且未过期，直接返回
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken;
  }

  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }),
  });

  const data: FeishuTokenResponse = await response.json();

  if (data.code !== 0) {
    throw new Error(`获取飞书 token 失败: ${data.msg}`);
  }

  // 缓存 token，提前 5 分钟过期
  cachedToken = data.tenant_access_token;
  tokenExpireTime = Date.now() + (data.expire - 300) * 1000;

  return cachedToken;
}

/**
 * 上传文件到飞书云空间
 * 
 * 通过飞书素材 API 上传文件，返回 file_token 可用于下载
 * 
 * @param file 文件 Buffer
 * @param fileName 文件名
 */
export async function uploadToFeishu(
  file: Buffer,
  fileName: string,
): Promise<UploadResult> {
  try {
    const token = await getTenantAccessToken();

    // 构建 multipart/form-data
    const boundary = `----FormBoundary${Date.now()}`;
    
    // 构建 form-data body（飞书素材上传格式）
    const parts: Buffer[] = [];
    
    // 文件类型
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file_type"\r\n\r\n` +
      `file\r\n`
    ));
    
    // 文件内容
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${encodeURIComponent(fileName)}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    ));
    parts.push(file);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    // 上传到飞书素材库
    const response = await fetch('https://open.feishu.cn/open-apis/drive/v1/medias/upload_all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    const data = await response.json();

    if (data.code !== 0) {
      // 如果素材上传失败，尝试另一种方式：通过文档上传
      return await uploadViaDocument(token, file, fileName);
    }

    const fileToken = data.data?.file_token;

    return {
      success: true,
      fileToken,
      fileName,
      fileSize: file.length,
      fileType: 'file',
      // 下载链接格式
      downloadUrl: `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 通过文档上传文件（备用方案）
 * 
 * 将文件上传到指定文档，获取 file_token
 */
async function uploadViaDocument(
  token: string,
  file: Buffer,
  fileName: string,
): Promise<UploadResult> {
  try {
    const boundary = `----FormBoundary${Date.now()}`;
    
    const parts: Buffer[] = [];
    
    // 文件内容
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${encodeURIComponent(fileName)}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    ));
    parts.push(file);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    // 使用文档素材上传 API
    const response = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${DEFAULT_DOC_TOKEN}/medias/upload_all`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: body,
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      return {
        success: false,
        error: `上传失败: ${data.msg}`,
      };
    }

    const fileToken = data.data?.file_token;

    return {
      success: true,
      fileToken,
      fileName,
      fileSize: file.length,
      fileType: 'file',
      downloadUrl: `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 获取文件下载链接
 * 
 * @param fileToken 文件 token
 * @param token 访问 token（可选，不传则自动获取）
 */
export async function getFileDownloadUrl(
  fileToken: string,
  token?: string
): Promise<string | null> {
  try {
    const accessToken = token || await getTenantAccessToken();

    // 构建下载 URL（需要带 Authorization header 访问）
    return `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`;

  } catch {
    return null;
  }
}

/**
 * 下载文件内容
 * 
 * @param fileToken 文件 token
 */
export async function downloadFile(fileToken: string): Promise<Buffer | null> {
  try {
    const token = await getTenantAccessToken();

    const response = await fetch(
      `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);

  } catch {
    return null;
  }
}

/**
 * 上传图片到飞书
 */
export async function uploadImageToFeishu(
  file: Buffer,
  fileName: string
): Promise<UploadResult> {
  // 图片也使用通用的文件上传
  return uploadToFeishu(file, fileName);
}

/**
 * 上传 PDF 到飞书
 */
export async function uploadPdfToFeishu(
  file: Buffer,
  fileName: string
): Promise<UploadResult> {
  return uploadToFeishu(file, fileName);
}

export type { UploadResult };