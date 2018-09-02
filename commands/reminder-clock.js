import { WebClient } from "@slack/client";
import moment from "moment-timezone";
import AcademyStudentGenerators from "../lib/generators/AcademyStudentGenerators";
import AcademyStaffGenerators from "../lib/generators/AcademyStaffGenerators";
import AcademyBase from "../lib/bases/AcademyBase";
import ApprenticeshipsBase from "../lib/bases/ApprenticeshipsBase";

const SLACK_TOKEN_STAFF = process.env.SLACK_TOKEN_STAFF;
const SLACK_TOKEN_STUDENT = process.env.SLACK_TOKEN_STUDENT;

const staffSlackClient = new WebClient(SLACK_TOKEN_STAFF);
const studentSlackClient = new WebClient(SLACK_TOKEN_STUDENT);

const ACADEMY_STUDENT_GENERATORS = AcademyStudentGenerators(AcademyBase);
const ACADEMY_STAFF_GENERATORS = AcademyStaffGenerators(AcademyBase);

async function reminderClock() {
  const now = moment().tz("Europe/London");
  const currentTimestamp = now.valueOf();
  console.log("Polling reminders for", now.format());
  await sendReminders(currentTimestamp, ACADEMY_STUDENT_GENERATORS, studentSlackClient).catch(
    console.error
  );
  await sendReminders(currentTimestamp, ACADEMY_STAFF_GENERATORS, staffSlackClient).catch(
    console.error
  );
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
