# RPC Proxy Solution for CORS Issues

## Problem

Public RPC endpoints don't allow CORS requests from browsers, causing:
- Balance fetching failures
- Grayed out "Start agent & stake" button
- Cannot verify funds

## Quick Solution: Use CORS-Friendly RPC

### Option 1: Ankr (Free, CORS-enabled)

Update your `.env.local`:

```bash
# In: /Users/andydeng/Downloads/olas3/olas-operate-app/frontend/.env.local

GNOSIS_RPC=https://rpc.ankr.com/gnosis
BASE_RPC=https://rpc.ankr.com/base
MODE_RPC=https://rpc.ankr.com/mode
OPTIMISM_RPC=https://rpc.ankr.com/optimism
```

Restart frontend:
```bash
cd /Users/andydeng/Downloads/olas3/olas-operate-app/frontend
# Press Ctrl+C to stop
yarn dev
```

### Option 2: Use Your Own RPC Keys

If you have Alchemy, Infura, or QuickNode accounts:

```bash
GNOSIS_RPC=https://gnosis-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY
# Mode might need different provider
```

### Option 3: Development CORS Bypass (Not Recommended)

Only for testing, disable web security in Chrome:

```bash
# macOS
open -na "Google Chrome" --args --disable-web-security --user-data-dir=/tmp/chrome_dev

# Then open http://localhost:3000 in that window
```

**⚠️ Warning**: Only use for development, never for production!

## After Fixing

Once RPC endpoints work:
1. Refresh browser
2. Balance checks should succeed
3. "Start agent & stake" button should become active
4. You can start the service

## Verifying the Fix

Check browser console:
- ✅ No more "Fetch API cannot load" errors
- ✅ Balance values displayed correctly
- ✅ Button is clickable

## Why This Happens

- Pearl Electron App: Uses Node.js (no CORS restrictions)
- Pearl Browser Mode: Uses browser (CORS enforced)
- Public RPCs: Block browser requests for security
- Private RPCs: Usually configure CORS properly
