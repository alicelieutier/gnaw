import importedMoment from "moment-timezone";
import Message from "../Message";

class WeekdailyGenerator {
  constructor(triggerHour, triggerMinute, generator, moment = importedMoment) {
    this.triggerHour = triggerHour;
    this.triggerMinute = triggerMinute;
    this.generator = generator;
    this.triggeredDays = [];
    this.moment = moment;
  }

  async produce(currentTimestamp) {
    const time = this.moment(currentTimestamp).tz("Europe/London");
    if (this._isWeekend(time)) {
      return [];
    }
    if (time.isBefore(this._todayTriggerTime(time))) {
      return [];
    }
    if (time.isAfter(this._todayTriggerTime(time).add(10, "minutes"))) {
      return [];
    }
    if (this._hasBeenTriggered(time)) {
      return [];
    }
    return this.generator(currentTimestamp, this._recordId(time));
  }

  async markComplete(message) {
    this.triggeredDays.push(message.recordId);
  }

  _isWeekend(time) {
    return time.isoWeekday() > 5;
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

export default WeekdailyGenerator;
