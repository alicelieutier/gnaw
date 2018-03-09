import { WebClient } from "@slack/client";
import getTasks from "../lib/getTasks";
import base from "../lib/base";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_TOKEN = process.env.SLACK_TOKEN

const REMINDER_NEEDED_FORMULA =
  "AND(DATETIME_DIFF({Start time}, NOW(), 'minutes') < 1000, DATETIME_DIFF({Start time}, NOW(), 'minutes') > 0, {Visible to students?} = 1, {Reminder given?} = 0)";

const slackWeb = new WebClient(SLACK_TOKEN);

function makeCohortChannelLookup() {
  return new Promise((resolve, reject) => {
    base("Cohorts")
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
    return id => records.find(record => record.id === id).get("Slack channel");
  });
}

function waitAndRemind() {
  makeCohortChannelLookup().then(lookup => {
    getTasks(base, "Upcoming", REMINDER_NEEDED_FORMULA).then(records => {
      records.forEach(record => {
        const remainingTime = Math.floor(
          (new Date(record.get("Start time")) - new Date()) / (60 * 1000)
        );
        const cohorts = record
          .get("Cohorts")
          .map(lookup)
          .join(",");
        const message = `<!channel> (${cohorts}) ${record.get(
          "Name"
        )} starting in ${remainingTime} minutes!`;
        slackWeb.chat.postMessage("#botfun", message).then(() => {
          base("Tasks").update(
            record.id,
            {
              "Reminder given?": true
            },
            error => {
              if (error) {
                return console.error(error);
              }
              console.log(`Successfully reminded of ${record.get("Name")}`);
            }
          );
        }).catch(err => console.error(err));
      });
    });
  });
}

export default waitAndRemind;
