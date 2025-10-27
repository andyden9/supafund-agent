// Test endpoint to verify environment variables
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    NODE_ENV: process.env.NODE_ENV,
    GNOSIS_RPC: process.env.GNOSIS_RPC || 'NOT SET',
    BASE_RPC: process.env.BASE_RPC || 'NOT SET',
    OPTIMISM_RPC: process.env.OPTIMISM_RPC || 'NOT SET',
    MODE_RPC: process.env.MODE_RPC || 'NOT SET',
    DEV_RPC: process.env.DEV_RPC || 'NOT SET',
  });
}
