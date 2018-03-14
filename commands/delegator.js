import morningCoachSummary from "./morning-coach-summary";
import commandLineCommands from "command-line-commands";
import formatUsage from "command-line-usage";
import reminderClock from "./reminder-clock";

const validCommands = ["morning-coach-summary", "reminder-clock", null];

const { command, argv } = commandLineCommands(validCommands);

if (command == "morning-coach-summary") {
  morningCoachSummary();
} else if (command == "reminder-clock") {
  reminderClock();
} else {
  console.log(
    formatUsage([
      {
        header: "Gnaw",
        content: "A friendly reminderbot"
      },
      {
        header: "Command List",
        content: [
          {
            name: "[bold]{morning-coach-summary}",
            description: "Sends the morning coach summary to #coaches"
          },
          {
            name: "[bold]{reminder-clock}",
            description: "Checks for reminders every minute and sends them"
          }
        ]
      }
    ])
  );
}
