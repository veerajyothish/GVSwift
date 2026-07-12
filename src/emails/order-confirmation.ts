/**
 * DEPRECATED — use OrderPlacedEmail from './order-placed' instead.
 *
 * This raw-HTML template has been superseded by the React Email version
 * (order-placed.tsx) which uses GVSwift brand colours, correct paise
 * formatting, and react-email components.
 *
 * The API route at src/app/api/email/order-confirmation/route.ts now
 * renders OrderPlacedEmail via renderAsync and passes sender: 'orders'.
 */
export {};
