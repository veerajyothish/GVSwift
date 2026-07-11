import { redis } from "./src/lib/redis";

async function run() {
  try {
    const res = await redis.scan("0", { match: "products:*", count: 100 });
    console.log("Scan result:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
