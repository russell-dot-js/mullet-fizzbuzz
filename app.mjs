import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Gazette } from "./exchange.mjs";
import statutes from "./statutes.mjs";
import { convene } from "./runtime/minutes.mjs";
import { adjudicate, benchNames, drawBench } from "./land-court.mjs";

import { parseArgs } from "node:util";
import { obtainCarriageRights } from "./carriage-return.mjs";

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  case: { type: "string" }, bench: { type: "string" }, minutes: { type: "boolean" },
  edition: { type: "string", default: "chartered" },
}});
const caseFile = values.case !== undefined;
const full = values.minutes;
const amount = Number(values.case ?? positionals[0] ?? 100);
if (!Number.isSafeInteger(amount) || amount < 0 || positionals.length > (caseFile ? 0 : 1) ||
    (full && !caseFile) || (values.bench !== undefined && !benchNames.includes(values.bench)) || !["chartered", "restated"].includes(values.edition)) {
  console.error("Usage: node app.mjs [limit | --case INTEGER [--minutes]] [--bench registry|queue|auction] [--edition chartered|restated]");
  process.exit(2);
}
const registry = fileURLToPath(new URL("./concession.rb", import.meta.url));

function punch(parcel) {
  // Columns 21–79 were sold to a vendor that went out of business in 1974.
  const lot = String(parcel).padStart(16, "0");
  return "LOT/" + lot + " ".repeat(59) + String(Number(lot) % 7);
}

function inspectNoise(writs) {
  const ordinance = fileURLToPath(new URL("./noise-ordinance.awk", import.meta.url));
  const survey = writs.map(writ => [writ.parcel, writ.order.signage].join("\t")).join("\n");
  const inspection = spawnSync("awk", ["-f", ordinance], { input: survey + "\n", encoding: "utf8" });
  if (inspection.error || inspection.status !== 0) throw Error(inspection.error?.message ?? inspection.stderr);
  return inspection.stdout.trimEnd().split("\n").map(line => {
    const [parcel, signage, hisses, license] = line.split("\t");
    return { parcel: Number(parcel), signage, hisses: Number(hisses), license };
  });
}

function auction(parcels) {
  const result = spawnSync("ruby", [registry], { input: parcels.map(punch).join("\n"), encoding: "utf8" });
  if (result.error || result.status !== 0) throw Error(result.error?.message ?? result.stderr);
  const tenders = result.stdout.trim().split("\n").map(line => JSON.parse(line));
  const assignments = new Map();
  const gazette = new Gazette();
  parcels.forEach((parcel, offset) => gazette.publish("lots.surveyed", { parcel, surveys: tenders[offset] }));
  gazette.subscribe("lots.surveyed", "court-of-first-remainder", ({ parcel, surveys }) => {
    const bench = values.bench ?? drawBench();
    assignments.set(parcel, bench);
    const order = adjudicate(parcel, surveys, values.edition, bench);
    gazette.publish("writs.issued", { parcel, surveys, order });
  });
  const awaitingSurvey = [];
  gazette.subscribe("writs.issued", "building-control", writ => awaitingSurvey.push(writ));
  const permits = inspectNoise(awaitingSurvey);
  awaitingSurvey.forEach((writ, index) => {
    const permit = permits[index];
    if (permit?.parcel !== writ.parcel || permit.signage !== writ.order.signage) {
      throw Error("This acoustic easement belongs to a different parcel.");
    }
    gazette.publish("permits.granted", { ...writ, permit });
  });
  gazette.subscribe("permits.granted", "keeper-of-the-seal", writ => {
    const docket = convene(statutes, { topic: "crown.parcel.v1", ...writ }, caseFile);
    gazette.publish("deeds.engrossed", { ...writ, docket });
  });
  const deeds = [];
  gazette.subscribe("deeds.engrossed", "office-of-carriage-returns", deed => deeds.push(deed));
  const grants = obtainCarriageRights(deeds);
  deeds.forEach((deed, index) => gazette.publish("paper.released", { ...deed, grant: grants[index] }));
  gazette.subscribe("paper.released", "highways-and-signage", ({ parcel, surveys, order, permit, docket, grant }) => {
    if (!caseFile) {
      process.stdout.write(grant.line);
      return;
    }
    console.log(`LAND COURT OF THE NATURAL NUMBERS • IN RE LOT ${parcel}`);
    if (full) console.log("Presiding bench: " + assignments.get(parcel));
    for (const bid of surveys) {
      console.log(`${bid.tenant}: ${bid.survey}. ${bid.accepted ? "Claims title." : "Disclaims title."}`);
    }
    console.log(`Noise inspector: ${permit.hisses} licensed hisses. ${permit.license}.`);
    console.log(order.writ + "\n" + order.holding);
    console.log(`Clerk's return: ${docket.hearings} hearings. Unpaid fees: ${docket.debt} cents.`);
    const { contracts, quarters, forecast, variance } = docket.settlement;
    console.log(`Underwriting: ${contracts} instruments settled. Q4 forecast: ${forecast} cents; actual: ${quarters[3]}; variance: ${variance}.`);
    console.log(`Newline supplied by: ${grant.press}. Outstanding paper lien: ${grant.lien} cents.`);
    for (const minute of full ? docket.minutes : docket.minutes.slice(-1)) {
      console.log(`${minute.title}\n  ${minute.finding} ${minute.ruling}`);
      if (full) {
        const votes = minute.motion.votes.map(vote => vote.chair + (vote.aye ? " (aye)" : " (nay)"));
        console.log(`  Roll call: ${votes.join(", ")}. Seal: ${minute.seal}`);
      }
    }
    process.stdout.write(`Deed: ${docket.seal}\nAuthorized roadside sign: ${grant.line}`);
  });
}

if (caseFile) auction([amount]);
else for (let start = 1; start <= amount; start += 100) {
  auction(Array.from({ length: Math.min(100, amount - start + 1) }, (_, index) => start + index));
}
