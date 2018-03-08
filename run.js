const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const { IncomingWebhook, WebClient } = require("@slack/client");
const Airtable = require("airtable");
const dateformat = require("dateformat");

Airtable.configure({
  apiKey: AIRTABLE_API_KEY
});
var base = Airtable.base(AIRTABLE_BASE_ID);

const ALL_FORMULA = "1";
const TODAY_FORMULA = "IS_SAME({End time}, TODAY(), 'day')";

function getTasks(viewName, formula = ALL_FORMULA) {
  let accumulatedRecords = [];
  return new Promise((resolve, reject) => {
    base("Tasks")
      .select({
        view: viewName,
        filterByFormula: formula
      })
      .eachPage(
        function page(records, fetchNextPage) {
          accumulatedRecords = [...accumulatedRecords, ...records];
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(accumulatedRecords);
        }
      );
  });
}

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
  return getTasks("Upcoming", TODAY_FORMULA)
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
