import Message from "../Message";

const PENDING_MESSAGE_FORMULA =
  "AND(DATETIME_DIFF({Send at}, NOW(), 'minutes') < 1, DATETIME_DIFF({Send at}, NOW(), 'minutes') > -15, {Sent?} = 0)";

class ArbitraryMessageGenerator {
  constructor(getTasks, cohortLookup, markCompleter) {
    this.getTasks = getTasks;
    this.cohortLookup = cohortLookup;
    this.markCompleter = markCompleter;
  }

  async produce(currentTimestamp) {
    const records = await this.getTasks(PENDING_MESSAGE_FORMULA);
    let accumulatedMessages = [];
    for (const record of records) {
      const messageBody = record.get("Message");
      const cohorts = await this._getCohorts(record);
      const messages = cohorts.map(cohort => new Message(messageBody, "#" + cohort, record.id));
      accumulatedMessages = [...accumulatedMessages, ...messages];
    }
    return accumulatedMessages;
  }

  markComplete(message) {
    return this.markCompleter(message.recordId);
  }

  async _getCohorts(record) {
    const cohortIds = record.get("Cohorts");
    if (!Array.isArray(cohortIds)) {
      return [];
    }
    return Promise.all(cohortIds.map(this.cohortLookup));
  }
}

export default ArbitraryMessageGenerator;
