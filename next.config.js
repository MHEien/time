await import("./src/env.js");
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
/** @type {import("next").NextConfig} */

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

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


    
export default config;
