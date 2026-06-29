import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { orderPlacedEmail, orderStatusChangedEmail, loyaltyPointsCalculation } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    orderPlacedEmail,
    orderStatusChangedEmail,
    loyaltyPointsCalculation,
  ],
});
