/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["thirdweb"], // 推荐：确保 thirdweb 被正确转译
  webpack: (config) => {
    // 屏蔽仅 RN/CLI 场景下的可选依赖，防止打包器去解析
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    config.resolve.alias["pino-pretty"] = false;
    return config;
  },
};

module.exports = nextConfig;
