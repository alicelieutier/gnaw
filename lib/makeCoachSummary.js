import moment from "moment-timezone";

async function makeCoachSummary(timestamp, getTasks, lookupCoachHandle) {
  const tasks = await getTasks(
    "Upcoming",
    `IS_SAME({End time}, DATETIME_PARSE(${timestamp}, 'x'), 'day')`
  );
  return ["Today's tasks:", createTodaysTasksMessage(tasks, lookupCoachHandle)]
    .filter(message => message.length > 0)
    .join("\n");
}

function createTodaysTasksMessage(tasks, handleLookup) {
  return tasks
    .map(record => {
      const coaches = formatCoachesForRecord(record, handleLookup);
      const startFormatted = formatStartTime(record.get("Start time"));
      return `${startFormatted}: ${record.get("Name")} (${coaches})`;
    })
    .join("\n");
}

function formatCoachesForRecord(record, handleLookup) {
  if (!Array.isArray(record.get("Coaches"))) {
    return record.get("External owner") || "*UNALLOCATED <!channel>*";
  }
  return formatCoachesList(record.get("Coaches"), handleLookup);
}

function formatCoachesList(list, handleLookup) {
  if (!Array.isArray(list) || list.length === 0) {
    return "*UNALLOCATED <!channel>*";
  }
  return list.map(coach => handleLookup(coach.id)).join(", ");
}

function formatStartTime(dateString) {
  const londonTime = moment.tz(dateString, "Europe/London");
  return londonTime.format("HH.mm");
}

export default makeCoachSummary;
