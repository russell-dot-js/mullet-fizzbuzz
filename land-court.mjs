import { randomInt } from "node:crypto";

// The constitution requires a lottery because awarding either sorting contract
// on merit would jeopardize the other two maintenance agreements.
const benches = {
  registry(tenants) {
    return [...tenants].sort((a, b) => a.easement - b.easement);
  },
  queue(tenants) {
    const procession = [];
    for (const claimant of tenants) {
      const junior = procession.findIndex(seated => seated.easement > claimant.easement);
      procession.splice(junior < 0 ? procession.length : junior, 0, claimant);
    }
    return procession;
  },
  auction(tenants) {
    const pending = [...tenants];
    const awards = [];
    while (pending.length) {
      let winner = 0;
      for (let bidder = 1; bidder < pending.length; bidder++) {
        if (pending[bidder].easement < pending[winner].easement) winner = bidder;
      }
      awards.push(pending.splice(winner, 1)[0]);
    }
    return awards;
  },
};

export const benchNames = Object.freeze(Object.keys(benches));

export function drawBench(draw = randomInt) {
  return benchNames[draw(benchNames.length)];
}

// The parcel can have many beneficial owners but the sign has only one line.
export function adjudicate(parcel, surveys, edition = "chartered", bench = drawBench()) {
  const tenants = benches[bench](surveys.filter(bid => bid.accepted));
  if (!tenants.length) return {
    writ: "Vacant possession",
    holding: "The integer may continue trading under its birth name.",
    signage: String(parcel),
  };
  if (tenants.length === 1) return {
    writ: "Sole occupancy",
    holding: tenants[0].covenant,
    signage: tenants[0].tenant,
  };
  // The smaller easement was surveyed first under the Little Divisor Treaty.
  const seniority = tenants;
  if (edition === "restated") return {
    writ: "Retroactive suffix rezoning under the Monday Morning Addendum",
    holding: "Buzz acquired the naming rights. Fizz retains an unobstructed view of the newline.",
    signage: seniority.reverse().map(bid => bid.tenant).join(""),
  };
  return {
    writ: "Party wall award under the Little Divisor Treaty",
    holding: "Fizz owns the frontage. Buzz has a perpetual right of way through the suffix.",
    signage: seniority.map(bid => bid.tenant).join(""),
  };
}
