import morningCoachSummary from "./morning-coach-summary";
import commandLineCommands from "command-line-commands";
import formatUsage from "command-line-usage";

const validCommands = ["morning-coach-summary", null];

const { command, argv } = commandLineCommands(validCommands);

if (command == "morning-coach-summary") {
  morningCoachSummary();
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
          }
        ]
      }
    ])
  );
}
