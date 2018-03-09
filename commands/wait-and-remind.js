import { WebClient } from "@slack/client";
import getTasks from "../lib/getTasks";
import base from "../lib/base";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_TOKEN = process.env.SLACK_TOKEN;

const REMINDER_NEEDED_FORMULA =
  "AND(DATETIME_DIFF({Start time}, NOW(), 'minutes') < 10, DATETIME_DIFF({Start time}, NOW(), 'minutes') > 0, {Visible to students?} = 1, {Reminder given?} = 0)";

const slackWeb = new WebClient(SLACK_TOKEN);

async function makeCohortChannelLookup() {
  const records = await base("Cohorts")
    .select({ view: "Grid view" })
    .firstPage();
  return id => records.find(record => record.id === id).get("Slack channel");
}

async function waitAndRemind() {
  const lookup = await makeCohortChannelLookup();
  const records = await getTasks(base, "Upcoming", REMINDER_NEEDED_FORMULA);
  records.forEach(async record => {
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
    await slackWeb.chat.postMessage("#botfun", message);
    await base("Tasks").update(record.id, { "Reminder given?": true });
    console.log(`Successfully reminded of ${record.get("Name")}`);
  });
}

export default waitAndRemind;
