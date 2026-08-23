import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { chatToContract as chatToContractType } from "../lib/ai";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const env = readFileSync(envPath, "utf8");

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    process.env[key] = value;
  }
}

const cases = [
  {
    name: "No price mentioned",
    input: `
Client: Hey Aisha, can you design a one-page portfolio site for my photography work?
Freelancer: Yes, I can do a responsive landing page with gallery and contact section.
Client: Great, need it by Friday. We can discuss money later.
Freelancer: Fine, I will share first draft before Friday.
`,
  },
  {
    name: "Negotiated price with final agreed number",
    input: `
Rohan: Need 5 Instagram reel edits for my cafe launch.
Maya: I can do it for 12000.
Rohan: Budget is 8000 only.
Maya: 8000 is low. I can do 10000 with 1 revision per reel.
Rohan: 9500 final?
Maya: Okay 9500 works, 50% advance and 50% after delivery.
Rohan: Done. Please deliver by 2026-09-01.
`,
  },
  {
    name: "Numbers that are not price",
    input: `
Client: My number is 9876543210. Need wedding invite website for 12 Dec 2026.
Freelancer: Sure, I can make RSVP form, venue section, and photo gallery.
Client: Add 3 pages and 2 revisions. Deadline 2026-11-20.
Freelancer: Confirmed. Payment terms we will decide later.
`,
  },
  {
    name: "Very short sparse conversation",
    input: `
Client: Bro logo bana doge?
Freelancer: Haan.
Client: Kab tak?
`,
  },
  {
    name: "Hinglish conversation",
    input: `
Neha: Bhai mujhe Shopify store setup karwana hai, 8 products add karne hain aur payment gateway connect karna hai.
Arjun: Ho jayega. 15000 lagega.
Neha: 12000 kar do please.
Arjun: Theek hai 13000 final, 50% advance baaki live hone ke baad.
Neha: Done, Monday tak chahiye. 2 revisions included?
Arjun: Haan 2 revisions included.
`,
  },
];

async function main() {
  loadEnvLocal();
  const { chatToContract } = (await import(
    new URL("../lib/ai.ts", import.meta.url).href
  )) as { chatToContract: typeof chatToContractType };

  for (const testCase of cases) {
    console.log(`\n=== ${testCase.name} ===`);
    console.log("INPUT:");
    console.log(testCase.input.trim());

    const output = await chatToContract(testCase.input);

    console.log("OUTPUT:");
    console.log(JSON.stringify(output, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
