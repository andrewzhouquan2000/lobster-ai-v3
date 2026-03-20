import { NextRequest, NextResponse } from 'next/server';
import { uploadToFeishu, uploadImageToFeishu, uploadPdfToFeishu } from '@/lib/feishu-upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到上传文件' },
        { status: 400 }
      );
    }

    // 检查文件大小 (最大 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 20MB' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 根据文件类型选择上传方法
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    let result;
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension)) {
      result = await uploadImageToFeishu(buffer, fileName);
    } else if (fileExtension === 'pdf') {
      result = await uploadPdfToFeishu(buffer, fileName);
    } else {
      result = await uploadToFeishu(buffer, fileName);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        name: result.fileName,
        size: result.fileSize,
        type: result.fileType,
        token: result.fileToken,
        url: result.downloadUrl,
      },
    });

  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '文件上传 API',
    usage: 'POST /api/upload with multipart/form-data',
    maxSize: '20MB',
  });
}