await import("./src/env.js");

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
    
export default config;
