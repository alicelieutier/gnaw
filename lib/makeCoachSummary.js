import moment from "moment-timezone";

function formatCoachesList(record, handleLookup) {
  if (!Array.isArray(record.get("Coaches"))) {
    return record.get("External owner") || "*UNALLOCATED <!channel>*";
  }
  return record
    .get("Coaches")
    .map(coach => {
      return handleLookup(coach.id);
    })
    .join(", ");
}

function formatStartTime(dateString) {
  const londonTime = moment.tz(dateString, "Europe/London");
  return londonTime.format("HH.mm");
}

function createCoachingDailyUpdateMessage(tasks, handleLookup) {
  return (
    "Today's tasks:\n" +
    tasks
      .map(record => {
        const coaches = formatCoachesList(record, handleLookup);
        const startFormatted = formatStartTime(record.get("Start time"));
        return `${startFormatted}: ${record.get("Name")} (${coaches})`;
      })
      .join("\n")
  );
}

async function makeCoachSummary(timestamp, getTasks, lookupCoachHandle) {
  const tasks = await getTasks(
    "Upcoming",
    `IS_SAME({End time}, DATETIME_PARSE(${timestamp}, 'x'), 'day')`
  );
  return createCoachingDailyUpdateMessage(tasks, lookupCoachHandle);
}

export default makeCoachSummary;
