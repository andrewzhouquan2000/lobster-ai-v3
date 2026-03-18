import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出（用于 OSS 托管）
  output: 'export',
  trailingSlash: true,
  
  // 图片优化配置
  images: {
    unoptimized: true,  // 静态导出需要禁用图片优化
  },
  
  // 环境变量
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
