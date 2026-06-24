# Bug Fixes Task List

- [x] Bug Fix 1: Sign out redirection
  - [x] Update `SignOutButton.tsx` to use `window.location.href = '/login'`
  - [x] Double-check `middleware.ts` for `getUser` usage
- [x] Bug Fix 2: Shipping pincode rejection
  - [x] Update `resolveBehavior` in `src/features/risk/service.ts` to make missing pincodes serviceable and COD eligible by default
  - [x] Modify `CheckoutClient.tsx` to add "Back to Address Input" button for non-serviceable addresses and pincode-related server errors
- [x] Run `npm run build` to verify 0 errors
- [ ] Commit and push changes
