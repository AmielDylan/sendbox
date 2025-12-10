import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Sharp est utilisé uniquement côté serveur dans les Server Actions
  serverExternalPackages: ['sharp'],
}

export default nextConfig
