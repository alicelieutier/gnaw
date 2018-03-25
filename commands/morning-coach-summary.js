import { IncomingWebhook } from "@slack/client";
import moment from "moment-timezone";
import getTasks from "../lib/getTasks";
import base from "../lib/base";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const TODAY_FORMULA = "IS_SAME({End time}, TODAY(), 'day')";

function formatCoachesList(record, handleLookup) {
  if (!Array.isArray(record.get("Coaches"))) {
    return record.get("External owner") || "*UNALLOCATED <!channel>*";
  }
  return record
    .get("Coaches")
    .map(coach => {
      return handleLookup(coach.id);
    })
    .join(", ");
}

function formatStartTime(dateString) {
  const londonTime = moment.tz(dateString, "Europe/London");
  return londonTime.format("HH.mm");
}

function createCoachingDailyUpdateMessage(handleLookup) {
  return getTasks(base, "Upcoming", TODAY_FORMULA)
    .then(records => {
      return (
        "Today's tasks:\n" +
        records
          .map(record => {
            const coaches = formatCoachesList(record, handleLookup);
            const startFormatted = formatStartTime(record.get("Start time"));
            return `${startFormatted}: ${record.get("Name")} (${coaches})`;
          })
          .join("\n")
      );
    })
    .catch(err => console.error(err));
}

function makeSlackHandleLookup() {
  return new Promise((resolve, reject) => {
    base("Coaches")
      .select({
        view: "Grid view"
      })
      .firstPage((err, records) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(records);
      });
  }).then(records => {
    return id => {
      const record = records.find(record => record.get("User").id === id);
      if (record) {
        return "<@" + record.get("Slack ID") + ">";
      }
      return "Unknown";
    };
  });
}

function morningCoachSummary() {
  makeSlackHandleLookup().then(lookup => {
    createCoachingDailyUpdateMessage(lookup).then(message => {
      const dailyUpdateHook = new IncomingWebhook(SLACK_WEBHOOK_URL);
      dailyUpdateHook.send(message, (error, resp) => {
        if (error) {
          return console.error(error);
        }
        console.log("Notification sent");
      });
    });
  });
}

export default morningCoachSummary;
