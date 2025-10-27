/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  transpilePackages: [
    'rc-util',
    'rc-tree',
    'rc-table',
    'rc-cascader',
    'rc-checkbox',
    'rc-collapse',
    'rc-drawer',
    'rc-dropdown',
    'rc-field-form',
    'rc-image',
    'rc-input-number',
    'rc-mentions',
    'rc-notification',
    'rc-pagination',
    'rc-picker',
    'rc-rate',
    'rc-segmented',
    'rc-slider',
    'rc-tabs',
    'rc-tooltip',
    'rc-tree-select',
    'rc-upload',
    '@babel/runtime',
    '@ant-design',
    'rc-tree',
    'rc-table',
    'rc-input',
  ],
  webpack: (config) => {
    if (config.snapshot) {
      config.snapshot = {
        ...(config.snapshot ?? {}),
        // Add all node_modules but @next module to managedPaths
        // Allows for hot refresh of changes to @next module
        managedPaths: [/^(.+?[\\/]node_modules[\\/])(?!@next)/],
      };
    }

    // Add module resolution for ESM imports without .js extension
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };

    return config;
  },
  env: {
    GNOSIS_RPC: process.env.GNOSIS_RPC,
    OPTIMISM_RPC: process.env.OPTIMISM_RPC,
    BASE_RPC: process.env.BASE_RPC,
    ETHEREUM_RPC: process.env.ETHEREUM_RPC,
    MODE_RPC: process.env.MODE_RPC,
    CELO_RPC: process.env.CELO_RPC,
  },
};

export default nextConfig;
