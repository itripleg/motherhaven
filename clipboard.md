# proper hook organization
/hooks
  /token
    - useTokenList.ts      # renamed from useTokens - for listing tokens
    - useTokenStats.ts     # for detailed token statistics
    - useTokenTrading.ts   # renamed from useTokenDetails - for trading interface
    - index.ts            # export all hooks

# /hooks/token/index.ts
export { useTokenList } from './useTokenList';
export { useTokenStats } from './useTokenStats';
export { useTokenTrading } from './useTokenTrading';

# Usage in components:
import { useTokenList } from '@/hooks/token';     # For token grid/lists
import { useTokenStats } from '@/hooks/token';    # For token stats page
import { useTokenTrading } from '@/hooks/token';  # For trading interface

# proper debug info

==================================
📦 BLOCK #36921113
⏰ 11/30/2024, 6:14:33 AM
==================================

--- Processing Log ---
Event Signature: 0x697c42d55a5e1fed3f464ec6f38b32546a0bd368dc8068b065c67566d73f3290

Matches:
- TokenCreated: false
- TokensPurchased: false
- TokensSold: true
- TradingHalted: false
Emitter: 0x7713a39875a5335dc4fc4f9359908afb55984b1f
// note we have topics
Topics: [
  "0x697c42d55a5e1fed3f464ec6f38b32546a0bd368dc8068b065c67566d73f3290",
  "0x000000000000000000000000febd8e3e366536f04ba2d5c1a5103a7ad1b02f1e",
  "0x000000000000000000000000d85327505ab915ab0c1aa5bc6768bf4002732258"
]
Data: 0x00000000000000000000000000000000000000000000006c6b935b8bbd4000000000000000000000000000000000000000000000000000001bca4f23eab84000
Transaction: 0xd8ea04ffb4719643aa1832d4cfa123bc2f51fec337b6e67a708c93b3e9e4946b
Value: 0x0
 POST /api/blockchain-monitor 200 in 12ms