import { NextRequest, NextResponse } from 'next/server';
import { TIANDITU_API_KEY } from '@/config/api-keys';

/**
 * 天地图WFS服务代理路由
 * 解决跨域问题并添加必要的API密钥
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 构建天地图WFS服务URL
    const params = new URLSearchParams(searchParams);
    
    // 确保请求中包含天地图API密钥
    if (!params.has('tk')) {
      params.set('tk', TIANDITU_API_KEY);
    }
    
    const targetUrl = `http://gisserver.tianditu.gov.cn/TDTService/wfs?${params.toString()}`;
    
    console.log('代理天地图WFS请求:', targetUrl);
    
    // 发送请求到天地图WFS服务
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MapApplication/1.0)',
        'Referer': request.headers.get('referer') || 'http://localhost:3000/',
      },
    });
    
    if (!response.ok) {
      throw new Error(`天地图服务返回错误: ${response.status} ${response.statusText}`);
    }
    
    // 获取响应内容
    const data = await response.json();
    
    // 返回代理的响应
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('天地图WFS服务代理错误:', error);
    
    return NextResponse.json(
      { error: '天地图服务请求失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 