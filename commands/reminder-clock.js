import { WebClient } from "@slack/client";
import getTasks from "../lib/getTasks";
import base from "../lib/base";
import StudentReminderGenerator from "../lib/message_generators/StudentReminderGenerator";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_TOKEN = process.env.SLACK_TOKEN;

const slackWeb = new WebClient(SLACK_TOKEN);

function makeCohortChannelLookup() {
  const recordsPromise = base("Cohorts")
    .select({ view: "Grid view" })
    .firstPage();
  return async id => {
    const records = await recordsPromise;
    return records.find(record => record.id === id).get("Slack channel");
  };
}

const GENERATORS = [
  new StudentReminderGenerator(
    formula => getTasks(base, "Upcoming", formula),
    makeCohortChannelLookup(),
    recordId => base("Tasks").update(recordId, { "Reminder given?": true })
  )
];

async function reminderClock() {
  const currentTimestamp = +new Date();
  console.log("No reminders as of", new Date());
  await sendReminders(currentTimestamp, GENERATORS);
  setTimeout(reminderClock, 60 * 1000);
}

async function sendReminders(currentTimestamp, generators) {
  if (generators.length === 0) {
    return;
  }
  const [generator, ...restGenerators] = generators;

  const messages = await generator.produce(currentTimestamp);
  await messages.reduce((promise, message) => {
    return promise.then(async () => {
      await slackWeb.chat.postMessage(
        "#botfun",
        `${message.getDestination()}: ${message.getBody()}`
      );
      console.log("Sent: ", message.getBody());
      await generator.markComplete(message);
    });
  }, Promise.resolve());

  await sendReminders(currentTimestamp, restGenerators);
}

export default reminderClock;
