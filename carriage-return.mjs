// The printer is a tenant of the revenue department. It accepts only a SOAP waybill.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { stamp } from "./mint/stamp.mjs";

export function obtainCarriageRights(deeds) {
  const stamps = stamp(deeds.map(deed => deed.docket.seal));
  const applications = deeds.map(({ parcel, order, docket }, index) => ({
    parcel, sign: order.signage, prospectus: docket.settlement, seal: docket.seal + "." + stamps[index],
  }));
  const manifest = JSON.stringify(applications).replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const soap = [
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:p="urn:mullet:stationery">',
    "<s:Body><p:Waybill>", manifest, "</p:Waybill></s:Body></s:Envelope>",
  ].join("");
  const printer = fileURLToPath(new URL("./stationery.py", import.meta.url));
  const reply = spawnSync("python3", [printer], { input: soap, encoding: "utf8" });
  if (reply.error || reply.status !== 0) throw Error(reply.error?.message ?? reply.stderr);
  const grants = JSON.parse(reply.stdout);
  if (grants.length !== applications.length ||
      grants.some((grant, index) => grant.seal !== applications[index].seal)) {
    throw Error("Printer returned another tenant's stationery.");
  }
  return grants;
}
