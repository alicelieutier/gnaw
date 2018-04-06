const MORNING_SLOT = "Morning";
const AFTERNOON_SLOT = "Afternoon";

async function getFloorCover(base, timestamp) {
  const records = await base("Third floor")
    .select({
      view: "Grid view",
      filterByFormula: `IS_SAME({Date}, DATETIME_PARSE(${timestamp}, 'x'), 'day')`
    })
    .firstPage();
  return {
    morning: coachesFor(MORNING_SLOT, records),
    afternoon: coachesFor(AFTERNOON_SLOT, records)
  };
}

function coachesFor(matcher, records) {
  const matchingRecords = records.filter(recordSlotIs(matcher));
  const coaches = matchingRecords.map(record => record.get("Coaches"));
  return flatten(coaches);
}

function recordSlotIs(matcher) {
  return record => record.get("Slot").includes(matcher);
}

function flatten([head, ...tail]) {
  if (tail.length === 0) {
    return head;
  }
  return [...head, ...flatten(tail)];
}

export default getFloorCover;
