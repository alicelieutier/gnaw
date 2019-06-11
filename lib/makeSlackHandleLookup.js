function makeSlackHandleLookup(base) {
  return new Promise((resolve, reject) => {
    base("Coaches")
      .select({
        view: "Grid view"
      })
      .firstPage((err, records) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(records);
      });
  }).then(records => {
    return id => {
      const record = records.find(record => {
        if (record.get("User") === undefined) {
          return false;
        }
        return record.get("User").id === id;
      });
      if (record) {
        return "<@" + record.get("Slack ID") + ">";
      }
      return "<!channel> Unknown assignee - Add their Slack ID to the Coaches table in Airtable";
    };
  });
}

export default makeSlackHandleLookup;
