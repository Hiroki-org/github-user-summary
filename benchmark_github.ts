import { fetchUserSummary } from "./src/lib/github";
import { performance } from "perf_hooks";

async function run() {
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    await fetchUserSummary("torvalds");
  }
  const end = performance.now();
  console.log(`Time taken: ${end - start}ms`);
}

run();
