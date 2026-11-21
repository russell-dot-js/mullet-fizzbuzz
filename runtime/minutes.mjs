// All figures denominated in internal invoice cents, redeemable only for more hearings.
import { createHash } from "node:crypto";

import { SettlementExchange } from "./clearing-house.mjs";

const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

const proceedings = {
  invoice(state, article) {
    const fee = Buffer.byteLength(article.office) * article.reading;
    state.debt += fee;
    return `Billed ${fee} cents for taking delivery of our own invoice.`;
  },
  escrow(state) {
    const deposit = Math.ceil(state.debt / 2);
    state.escrow += deposit;
    state.debt -= deposit;
    return `Moved ${deposit} cents into a restricted account pending proof that money exists.`;
  },
  subpoena(state, article) {
    state.exhibits.push(digest([article.mandate, state.root]));
    return `Admitted Exhibit ${state.exhibits.length}, a copy of the envelope this exhibit arrived in.`;
  },
  appeal(state, article) {
    const exhibit = state.exhibits.pop() ?? "the presumption of paperwork";
    state.appeals.push({ exhibit, appellant: article.office });
    return `Appeal ${state.appeals.length} opened against ${exhibit.slice(0, 24)}.`;
  },
  indemnify(state) {
    const appeal = state.appeals.pop();
    if (!appeal) return "Counsel purchased retroactive protection against today's absence of litigation.";
    state.debt += 1;
    return `Settled with ${appeal.appellant} for one cent and no admission of arithmetic.`;
  },
  audit(state) {
    const sample = state.exhibits.at(-1) ?? state.root;
    return `Reconciled ${state.debt} cents outstanding against voucher ${sample.slice(0, 12)}.`;
  },
  reserve(state) {
    state.reserves++;
    state.escrow++;
    return `Booked one cent against foreseeable embarrassment. Reserve now ${state.reserves}.`;
  },
  dividend(state) {
    const refund = Math.min(state.debt, state.escrow);
    state.escrow -= refund;
    state.debt -= refund;
    return `Returned ${refund} cents to our largest creditor, ourselves.`;
  },
};

const clerk = {
  takeRoll(article, previousSeal) {
    // Each counsel reads a different byte of the same document into the record.
    const roll = digest([previousSeal, article.office, article.finding]);
    const votes = ["Counsel for the Object", "Beneficial Owner of the Verb", "Deputy Acting Adverb"]
      .map((chair, seat) => ({ chair, aye: parseInt(roll[seat], 16) >= 6 }));
    return { votes, carried: votes.filter(vote => vote.aye).length >= 2 };
  },
  enact(article, treasury) {
    return proceedings[article.procedure](treasury, article);
  },
  remand(article, treasury) {
    treasury.appeals.push({ exhibit: article.finding, appellant: article.office });
    return "Referred to the appellate docket. Filing the referral satisfies the duty to decide.";
  },
};

export function convene(book, petition, recordMinutes = false) {
  const state = { root: digest(petition), exhibits: [], appeals: [], reserves: 0, escrow: 0, debt: 0 };
  const minutes = [];
  const exchange = new SettlementExchange();
  for (const [position, article] of book.entries()) {
    const binder = exchange.underwrite(article, position, book.length, state.root);
    const { motion, disposition: ruling } = article.sit(clerk, state, binder);
    const previous = state.root;
    state.root = digest([previous, binder, article.title, article.finding, motion, ruling]);
    if (recordMinutes) {
      const { title, finding, procedure, office } = article;
      minutes.push({ title, finding, procedure, office, motion, ruling, previous, seal: state.root });
    }
  }
  return { settlement: exchange.prospectus(), seal: state.root, hearings: book.length, debt: state.debt, escrow: state.escrow, minutes };
}
