/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  // 允许外部图像域
  images: {
    domains: ['api.tianditu.gov.cn', 't0.tianditu.gov.cn', 'lbs.tianditu.gov.cn'],
  },
  // 为web端集成做准备
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // 配置静态资源目录和API代理
  async rewrites() {
    return [
      {
        source: '/data/:path*',
        destination: '/data/:path*',
      },
      // 添加天地图WFS服务代理
      {
        source: '/api/tianditu-wfs',
        destination: 'http://gisserver.tianditu.gov.cn/TDTService/wfs',
      },
      // 添加天地图瓦片服务代理
      {
        source: '/tianditu/:path*',
        destination: 'https://t0.tianditu.gov.cn/:path*',
      }
    ];
  },
  // 确保生产环境也能访问静态资源
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : undefined,
};

module.exports = nextConfig;
