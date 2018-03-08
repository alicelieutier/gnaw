import { IncomingWebhook } from "@slack/client";
import getTasks from "../lib/getTasks";
import base from "../lib/base";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const REMINDER_NEEDED_FORMULA =
  "AND(DATETIME_DIFF({Start time}, NOW(), 'minutes') < 10, DATETIME_DIFF({Start time}, NOW(), 'minutes') > 0, {Visible to students?} = 1, {Reminder given?} = 0)";

const studentReminderHook = new IncomingWebhook(SLACK_WEBHOOK_URL);

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
        studentReminderHook.send(message, (error, resp) => {
          if (error) {
            return console.error(error);
          }
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
        });
      });
    });
  });
}

export default waitAndRemind;
