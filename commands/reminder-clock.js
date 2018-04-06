import { WebClient } from "@slack/client";
import moment from "moment-timezone";
import getTasks from "../lib/getTasks";
import base from "../lib/base";
import StudentReminderGenerator from "../lib/message_generators/StudentReminderGenerator";
import ArbitraryMessageGenerator from "../lib/message_generators/ArbitraryMessageGenerator";
import DailyGenerator from "../lib/message_generators/DailyGenerator";
import makeSlackHandleLookup from "../lib/makeSlackHandleLookup";
import makeCoachSummary from "../lib/makeCoachSummary";
import Message from "../lib/Message";
const SLACK_TOKEN_STAFF = process.env.SLACK_TOKEN_STAFF;
const SLACK_TOKEN_STUDENT = process.env.SLACK_TOKEN_STUDENT;

const staffSlackClient = new WebClient(SLACK_TOKEN_STAFF);
const studentSlackClient = new WebClient(SLACK_TOKEN_STUDENT);

function makeCohortChannelLookup() {
  const recordsPromise = base("Cohorts")
    .select({ view: "Grid view" })
    .firstPage();
  return async id => {
    const records = await recordsPromise;
    return records.find(record => record.id === id).get("Slack channel");
  };
}

const cohortChannelLookup = makeCohortChannelLookup();

const STUDENT_GENERATORS = [
  new StudentReminderGenerator(
    formula => getTasks(base, "Upcoming", formula),
    cohortChannelLookup,
    recordId => base("Tasks").update(recordId, { "Reminder given?": true })
  ),
  new ArbitraryMessageGenerator(
    formula =>
      base("Messages")
        .select({ view: "Upcoming", filterByFormula: formula })
        .firstPage(),
    cohortChannelLookup,
    recordId => base("Messages").update(recordId, { "Sent?": true })
  )
];

const STAFF_GENERATORS = [
  new DailyGenerator(9, 0, async (timestamp, id) => {
    const handleLookup = await makeSlackHandleLookup(base);
    const message = await makeCoachSummary(
      timestamp,
      (view, formula) => getTasks(base, view, formula),
      handleLookup
    );
    return [new Message(message, "#coaches", id)];
  })
];

async function reminderClock() {
  const now = moment().tz("Europe/London");
  const currentTimestamp = now.valueOf();
  console.log("Polling reminders for", now.format());
  await sendReminders(currentTimestamp, STUDENT_GENERATORS, studentSlackClient);
  await sendReminders(currentTimestamp, STAFF_GENERATORS, staffSlackClient);
  setTimeout(reminderClock, 60 * 1000);
}

async function sendReminders(currentTimestamp, generators, slackClient) {
  if (generators.length === 0) {
    return;
  }
  const [generator, ...restGenerators] = generators;

  const messages = await generator.produce(currentTimestamp);
  await messages.reduce((promise, message) => {
    return promise.then(async () => {
      await slackClient.chat
        .postMessage(`#${message.getDestination()}`, message.getBody(), { link_names: true })
        .catch(err => handleMessageSendError(message))
        .then(() => logSent(message));
      await generator.markComplete(message);
    });
  }, Promise.resolve());

  await sendReminders(currentTimestamp, restGenerators);
}

function handleMessageSendError(message) {
  console.error("Could not send message to", message.getDestination());
}

function logSent(message) {
  console.log("Sent: ", message.getBody());
}

export default reminderClock;
