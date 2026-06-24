# Checkout & Loyalty UI Task List

- [x] Fix 1: Checkout 400 Bad Request
  - [x] Verify `src/features/checkout/validation.ts` schema defaults pointsToRedeem
  - [x] Update `/api/v1/loyalty/me` endpoint to return `rupeesPer100Points`
  - [x] Ensure CheckoutClient always sends pointsToRedeem as a number in the fetch body
- [x] Fix 2: Loyalty points checkbox visible at checkout
  - [x] Fetch loyalty balance client-side on mount in `CheckoutClient.tsx`
  - [x] Store loyalty balance and settings in component state
  - [x] Render checkbox section `Use [X] points for ₹[Y] off` above the total row
  - [x] Update price calculations based on state balance & checkbox status
- [x] Fix 3: Sentry double init warning
  - [x] Delete `sentry.client.config.ts`
- [x] Run `npx next build` to verify zero errors and warnings
- [x] Commit and push changes
