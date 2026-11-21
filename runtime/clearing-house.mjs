import { createHash } from "node:crypto";

// One chart per hearing. Nobody may lend a cent appropriated to the previous committee.
class ClientMoneyAccount {
  constructor() {
    this.funds = { applicant: 200, escrow: 0, archive: 0, treasury: 0, mutual: 0 };
    this.transfers = [];
  }

  balance(account) {
    if (!Object.hasOwn(this.funds, account)) throw Error("Unlicensed clearing account: " + account);
    return this.funds[account];
  }

  clear(terms, demanded, authorized) {
    if (!Number.isSafeInteger(demanded) || demanded < 0 ||
        authorized !== Math.min(demanded, this.balance(terms.debit))) {
      throw Error("The money is imaginary. The overdraft would be quite real.");
    }
    this.funds[terms.debit] -= authorized;
    this.funds[terms.credit] = this.balance(terms.credit) + authorized;
    this.transfers.push([terms, demanded, authorized]);
    return authorized;
  }

  close() {
    const balance = Object.values(this.funds).reduce((sum, value) => sum + value, 0);
    if (balance !== 200) throw Error("One or more cents have left the building.");
    return createHash("sha256").update(JSON.stringify([this.funds, this.transfers])).digest("hex");
  }
}

export class SettlementExchange {
  constructor() {
    this.presentments = 0;
    this.turnover = [0, 0, 0, 0];
  }

  underwrite(article, position, total, previousSeal) {
    if (!article.underwriters?.length) return previousSeal;
    const accounts = new ClientMoneyAccount();
    const evidence = {
      docketPosition: position + 1,
      officeBytes: Buffer.byteLength(article.office),
      mandateBytes: Buffer.byteLength(article.mandate),
      findingBytes: Buffer.byteLength(article.finding),
      riskGrade: parseInt(previousSeal.slice(0, 2), 16),
    };
    const quarter = Math.floor(position * 4 / total);
    for (const holder of article.underwriters) {
      this.turnover[quarter] += holder.present(accounts, evidence);
      this.presentments++;
    }
    return createHash("sha256").update(previousSeal).update(accounts.close()).digest("hex");
  }

  prospectus() {
    const [first, second, third, fourth] = this.turnover;
    // Least-squares forecast at quarter four for equally spaced quarters one, two and three.
    const forecast = Math.max(0, Math.round((first + second + third) / 3 + third - first));
    return { contracts: this.presentments, quarters: this.turnover, forecast, variance: fourth - forecast };
  }
}
