/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  async redirects() {
    return [
      {
        source: '/UB-:code',
        destination: '/dashboard?sublocation=UB-:code',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
