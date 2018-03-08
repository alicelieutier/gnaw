import { IncomingWebhook } from "@slack/client";
import dateformat from "dateformat";
import getTasks from "../lib/getTasks";
import base from "../lib/base";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const TODAY_FORMULA = "IS_SAME({End time}, TODAY(), 'day')";

function formatCoachesList(coaches, handleLookup) {
  return coaches
    .map(coach => {
      return `${coach.name} (<@${handleLookup(coach.id)}>)`;
    })
    .join(", ");
}

function formatStartTime(dateString) {
  const date = new Date(dateString);
  return dateformat(date, "HH.MM");
}

function createCoachingDailyUpdateMessage(handleLookup) {
  return getTasks(base, "Upcoming", TODAY_FORMULA)
    .then(records => {
      return (
        "Today's tasks:\n" +
        records
          .map(record => {
            const coaches = formatCoachesList(
              record.get("Coaches"),
              handleLookup
            );
            const startFormatted = formatStartTime(record.get("Start time"));
            return `${startFormatted}: ${coaches} runs ${record.get("Name")}`;
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
    return id =>
      records.find(record => record.get("User").id === id).get("Slack ID");
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
