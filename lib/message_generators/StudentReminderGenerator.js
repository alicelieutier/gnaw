import Message from "../Message";

const REMINDER_NEEDED_FORMULA =
  "AND(DATETIME_DIFF({Start time}, NOW(), 'minutes') < 10, DATETIME_DIFF({Start time}, NOW(), 'minutes') > 0, {Visible to students?} = 1, {Reminder given?} = 0)";

class StudentReminderGenerator {
  constructor(getTasks, cohortLookup, markCompleter) {
    this.getTasks = getTasks;
    this.cohortLookup = cohortLookup;
    this.markCompleter = markCompleter;
  }

  async produce(currentTimestamp) {
    const records = await this.getTasks(REMINDER_NEEDED_FORMULA);
    let accumulatedMessages = [];
    for (const record of records) {
      const messageBody = this._makeMessage(currentTimestamp, record);
      const cohorts = await this._getCohorts(record);
      const messages = cohorts.map(cohort => new Message(messageBody, "#" + cohort, record.id));
      accumulatedMessages = [...accumulatedMessages, ...messages];
    }
    return accumulatedMessages;
  }

  markComplete(message) {
    return this.markCompleter(message.recordId);
  }

  _makeMessage(currentTimestamp, record) {
    const remainingTime = Math.floor(
      (new Date(record.get("Start time")) - currentTimestamp) / (60 * 1000)
    );
    return `<!channel> ${record.get("Name")} starting in ${remainingTime} minutes!`;
  }

  async _getCohorts(record) {
    const cohortIds = record.get("Cohorts");
    if (!Array.isArray(cohortIds)) {
      return [];
    }
    return Promise.all(cohortIds.map(this.cohortLookup));
  }
}

export default StudentReminderGenerator;
