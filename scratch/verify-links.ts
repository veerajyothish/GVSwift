/**
 * scratch/verify-links.ts
 *
 * Verifies that all legal pages and footer links exist and return status 200
 * (or redirect 307 for protected support page).
 *
 * Run with: npx tsx scratch/verify-links.ts
 */

import http from "http";

const LINKS = [
  { path: "/", expectedStatus: 200 },
  { path: "/products", expectedStatus: 200 },
  { path: "/faq", expectedStatus: 200 },
  { path: "/privacy", expectedStatus: 200 },
  { path: "/terms", expectedStatus: 200 },
  { path: "/returns", expectedStatus: 200 },
  { path: "/shipping", expectedStatus: 200 },
  { path: "/cookies", expectedStatus: 200 },
  { path: "/disclaimer", expectedStatus: 200 },
  { path: "/grievance", expectedStatus: 200 },
  { path: "/support", expectedStatus: 307 }, // should redirect to /login
];

async function checkLink(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      resolve(res.statusCode || 0);
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.end();
  });
}

async function main() {
  console.log("\n🧪 TICKET-801: Verifying Footer & Legal Page HTTP Statuses\n");
  let passed = 0;
  let failed = 0;

  for (const link of LINKS) {
    try {
      const status = await checkLink(link.path);
      // Next.js Dev Server returns either expectedStatus or might return redirect
      if (status === link.expectedStatus || (link.expectedStatus === 307 && status === 307) || (link.path === "/support" && status === 302)) {
        console.log(`  ✅ ${link.path} returned status ${status} (expected ${link.expectedStatus})`);
        passed++;
      } else {
        console.error(`  ❌ ${link.path} returned status ${status} (expected ${link.expectedStatus})`);
        failed++;
      }
    } catch (err: any) {
      console.error(`  ❌ Failed to request ${link.path}:`, err.message);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Verification Results: ${passed} passed, ${failed} failed`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
