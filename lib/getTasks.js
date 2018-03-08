const ALL_FORMULA = "1";

function getTasks(base, viewName, formula = ALL_FORMULA) {
  let accumulatedRecords = [];
  return new Promise((resolve, reject) => {
    base("Tasks")
      .select({
        view: viewName,
        filterByFormula: formula
      })
      .eachPage(
        function page(records, fetchNextPage) {
          accumulatedRecords = [...accumulatedRecords, ...records];
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(accumulatedRecords);
        }
      );
  });
}

export default getTasks;
