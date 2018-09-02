import { WebClient } from "@slack/client";
import moment from "moment-timezone";
import AcademyStudentGenerators from "../lib/generators/AcademyStudentGenerators";
import AcademyStaffGenerators from "../lib/generators/AcademyStaffGenerators";
import ApprenticeshipsStudentGenerators from "../lib/generators/ApprenticeshipsStudentGenerators";
import ApprenticeshipsStaffGenerators from "../lib/generators/ApprenticeshipsStaffGenerators";
import AcademyBase from "../lib/bases/AcademyBase";
import ApprenticeshipsBase from "../lib/bases/ApprenticeshipsBase";

const SLACK_TOKEN_STAFF = process.env.SLACK_TOKEN_STAFF;
const SLACK_TOKEN_STUDENT_ACADEMY = process.env.SLACK_TOKEN_STUDENT_ACADEMY;
const SLACK_TOKEN_STUDENT_APPRENTICESHIPS = process.env.SLACK_TOKEN_STUDENT_APPRENTICESHIPS;

const staffSlackClient = new WebClient(SLACK_TOKEN_STAFF);
const academyStudentSlackClient = new WebClient(SLACK_TOKEN_STUDENT_ACADEMY);
const apprenticeshipsStudentSlackClient = new WebClient(SLACK_TOKEN_STUDENT_APPRENTICESHIPS);

const ACADEMY_STUDENT_GENERATORS = AcademyStudentGenerators(AcademyBase);
const ACADEMY_STAFF_GENERATORS = AcademyStaffGenerators(AcademyBase);
const APPRENTICESHIPS_STUDENT_GENERATORS = ApprenticeshipsStudentGenerators(ApprenticeshipsBase);
const APPRENTICESHIPS_STAFF_GENERATORS = ApprenticeshipsStaffGenerators(ApprenticeshipsBase);

async function reminderClock() {
  const now = moment().tz("Europe/London");
  const currentTimestamp = now.valueOf();
  console.log("Polling reminders for", now.format());
  await sendReminders(
    currentTimestamp,
    ACADEMY_STUDENT_GENERATORS,
    academyStudentSlackClient
  ).catch(console.error);
  await sendReminders(currentTimestamp, ACADEMY_STAFF_GENERATORS, staffSlackClient).catch(
    console.error
  );
  await sendReminders(
    currentTimestamp,
    APPRENTICESHIPS_STUDENT_GENERATORS,
    apprenticeshipsStudentSlackClient
  ).catch(console.error);
  await sendReminders(currentTimestamp, APPRENTICESHIPS_STAFF_GENERATORS, staffSlackClient).catch(
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
      console.log(`#${message.getDestination()}`, message.getBody());
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
