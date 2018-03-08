const CONFIG = require('./env.json');
const AIRTABLE_API_KEY = CONFIG.AIRTABLE_API_KEY;
const BASE_ID = CONFIG.BASE_ID;

var Airtable = require("airtable");
Airtable.configure({
  apiKey: AIRTABLE_API_KEY
});
var base = Airtable.base(BASE_ID);

const ALL_FORMULA = "1";
const TODAY_FORMULA = "IS_SAME({End time}, TODAY(), 'day')";

function getTasks(viewName, formula = ALL_FORMULA) {
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

function formatCoachesList(coaches) {
  return coaches.map(coach => coach.name).join(", ");
}

getTasks("Upcoming", TODAY_FORMULA).then(records => {
  records.forEach(record => {
    const coaches = formatCoachesList(record.get("Coaches"))
    console.log("Today:", coaches, "runs", record.get("Name"))
  })
}).catch(err => console.error(err))
