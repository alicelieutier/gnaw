import moment from "moment-timezone";
import Message from "../Message";

class DailyGenerator {
  constructor(triggerHour, triggerMinute, generator) {
    this.triggerHour = triggerHour;
    this.triggerMinute = triggerMinute;
    this.generator = generator;
    this.triggeredDays = [];
  }

  async produce(currentTimestamp) {
    const time = moment(currentTimestamp);
    if (time.isBefore(this._todayTriggerTime(time))) {
      return [];
    }
    if (this._hasBeenTriggered(time)) {
      return [];
    }
    return this.generator(this._recordId(time));
  }

  async markComplete(message) {
    this.triggeredDays.push(message.recordId);
  }

  _recordId(time) {
    return time.format("YYYY-MM-DD");
  }

  _hasBeenTriggered(time) {
    return this.triggeredDays.includes(this._recordId(time));
  }

  _todayTriggerTime(time) {
    return time
      .clone()
      .hour(this.triggerHour)
      .minute(this.triggerMinute)
      .second(0)
      .millisecond(0);
  }
}

export default DailyGenerator;
