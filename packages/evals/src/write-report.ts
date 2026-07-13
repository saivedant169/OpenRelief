import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildCaliforniaWildfireEvalReport } from "./results";

const reportPath = path.join(process.cwd(), "packages", "evals", "reports", "california-wildfire-v1.json");

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(buildCaliforniaWildfireEvalReport(), null, 2)}\n`);
