export default function makeCohortChannelLookup(base) {
  const recordsPromise = base("Cohorts")
    .select({ view: "Grid view" })
    .firstPage();
  return async id => {
    const records = await recordsPromise;
    return records.find(record => record.id === id).get("Slack channel");
  };
}
