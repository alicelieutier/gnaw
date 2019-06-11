import getTasks from "../getTasks";
import StudentReminderGenerator from "../message_generators/StudentReminderGenerator";
import makeCohortChannelLookup from "../makeCohortChannelLookup";

export default base => {
  const cohortChannelLookup = makeCohortChannelLookup(base);

  return [
    new StudentReminderGenerator(
      formula => getTasks(base, "Upcoming", formula),
      cohortChannelLookup,
      recordId => base("Tasks").update(recordId, { "Reminder given?": true })
    )
  ];
};
