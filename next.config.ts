import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // webpack: (config, { isServer }) => {
  //   // `@monaco-editor/react` typically handles its workers well.
  //   // If encountering issues with Monaco workers in production builds,
  //   // specific webpack configurations might be needed here,
  //   // often involving `monaco-editor-webpack-plugin`.
  //   // For now, assuming default handling by the library is sufficient.
  //   return config;
  // },
};

export default nextConfig;
