import getTasks from "../getTasks";
import StudentReminderGenerator from "../message_generators/StudentReminderGenerator";
import ArbitraryMessageGenerator from "../message_generators/ArbitraryMessageGenerator";
import makeCohortChannelLookup from "../makeCohortChannelLookup";

export default base => {
  const cohortChannelLookup = makeCohortChannelLookup(base);

  return [
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
};
