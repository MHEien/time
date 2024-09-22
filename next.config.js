await import("./src/env.js");
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
/** @type {import("next").NextConfig} */
const config = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'media.licdn.com',
            port: '',
            pathname: '/**',
          },
        ],
      },
  }

  if (process.env.NODE_ENV === 'development') {
    await setupDevPlatform();
  }
    
export default config;
