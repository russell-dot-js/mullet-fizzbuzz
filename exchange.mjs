// Local Kafka-style append-only topics. Groups own offsets, including the group of one
// that is legally permitted to erect road signs. Nothing clears until its handler returns.
export class Gazette {
  #logs = new Map();
  #offsets = new Map();

  publish(topic, deed) {
    if (!this.#logs.has(topic)) this.#logs.set(topic, []);
    this.#logs.get(topic).push(structuredClone(deed));
  }

  subscribe(topic, group, handler) {
    const account = JSON.stringify([topic, group]);
    const entries = this.#logs.get(topic) ?? [];
    let next = this.#offsets.get(account) ?? 0;
    while (next < entries.length) {
      handler(structuredClone(entries[next]), next);
      this.#offsets.set(account, ++next);
    }
  }
}
