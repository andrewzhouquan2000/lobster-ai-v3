#!/bin/bash
# Lobster AI V2 - 阿里云 FC 部署脚本
# 使用前确保已安装: Node.js, s (Serverless DevTools)

set -e

echo "🦞 Lobster AI V2 - FC 部署脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "\n${YELLOW}检查依赖...${NC}"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js: $(node -v)${NC}"
    
    # 检查 s (Serverless DevTools)
    if ! command -v s &> /dev/null; then
        echo -e "${YELLOW}! Serverless DevTools (s) 未安装${NC}"
        echo "正在安装 s..."
        npm install -g @serverless-devs/s
    fi
    echo -e "${GREEN}✓ Serverless DevTools: $(s -v)${NC}"
}

# 构建项目
build_project() {
    echo -e "\n${YELLOW}构建项目...${NC}"
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "安装依赖..."
        npm install
    fi
    
    # 构建 Next.js
    npm run build
    
    # 检查构建输出
    if [ ! -d ".next" ]; then
        echo -e "${RED}❌ 构建失败: .next 目录不存在${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 构建完成${NC}"
}

# 准备部署包
prepare_deploy_package() {
    echo -e "\n${YELLOW}准备部署包...${NC}"
    
    # 创建临时目录
    rm -rf .fc-build
    mkdir -p .fc-build
    
    # 复制必要文件
    cp -r .next .fc-build/
    cp -r public .fc-build/
    cp -r node_modules .fc-build/
    cp package.json .fc-build/
    cp fc-handler.js .fc-build/
    cp next.config.ts .fc-build/
    
    # 复制环境变量（生产环境应该使用 FC 环境变量配置）
    if [ -f .env.local ]; then
        cp .env.local .fc-build/
    fi
    
    echo -e "${GREEN}✓ 部署包准备完成${NC}"
}

# 部署到 FC
deploy_fc() {
    echo -e "\n${YELLOW}部署到阿里云 FC...${NC}"
    
    # 使用 s deploy
    s deploy -y
    
    echo -e "${GREEN}✓ 部署完成${NC}"
}

# 主流程
main() {
    cd "$(dirname "$0")/.."
    
    check_dependencies
    build_project
    prepare_deploy_package
    deploy_fc
    
    echo -e "\n${GREEN}🦞 部署成功！${NC}"
    echo "访问您的函数：https://cn-hangzhou.fc.aliyuncs.com"
}

# 支持的命令
case "$1" in
    build)
        cd "$(dirname "$0")/.."
        build_project
        ;;
    package)
        cd "$(dirname "$0")/.."
        prepare_deploy_package
        ;;
    deploy)
        main
        ;;
    *)
        main
        ;;
esac