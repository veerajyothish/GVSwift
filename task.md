# Checkout & Loyalty UI Task List

- [x] Fix 1: Checkout 400 Bad Request
  - [x] Verify `src/features/checkout/validation.ts` schema defaults pointsToRedeem
  - [x] Update `/api/v1/loyalty/me` endpoint to return `rupeesPer100Points`
  - [x] Ensure CheckoutClient always sends pointsToRedeem as a number in the fetch body
- [x] Fix 2: Loyalty points checkbox visible at checkout
  - [x] Update `src/app/globals.css`
  - [x] Add global font-variant-numeric: tabular-nums for prices and statistics
  - [x] Add text-wrap: balance for headings and text-wrap: pretty for paragraphs
  - [x] Add transition and scale-on-press active state for `button`, `.btn`, and `a.btn` elements
- [x] Update `src/app/(public)/cart/CartPageClient.tsx`
  - [x] Add tabular-nums variant to dynamic pricing displays (subtotal and total)
- [x] Update `src/app/account/loyalty/LoyaltyPageClient.tsx`
  - [x] Add tabular-nums variant to user statistics and points history deltas
- [x] Verify build with `npx next build`
- [x] Check in all modifications via git commit & push changes
