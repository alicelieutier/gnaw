import Message from "../Message";
import ArbitraryMessageGenerator from "./ArbitraryMessageGenerator";

const NOW = 1521032816573;
const EXPECTED_QUERY =
  "AND(DATETIME_DIFF({Send at}, NOW(), 'minutes') < 1, DATETIME_DIFF({Send at}, NOW(), 'minutes') > 15, {Sent?} = 0)";

describe("#produce", () => {
  it("returns messages for the events in the next 10 minutes", async () => {
    const getTasks = fakeGetTasksFor(EXPECTED_QUERY, [
      { Message: "Hello!", Cohorts: ["55"] },
      { Message: "World!", Cohorts: ["56"] }
    ]);
    const generator = new ArbitraryMessageGenerator(getTasks, cohortLookup);
    const messages = await generator.produce(NOW);
    expect(messages).toEqual([
      new Message("Hello!", "#january2018"),
      new Message("World!", "#february2018")
    ]);
  });

  it("returns messages when an event has multiple cohorts", async () => {
    const getTasks = fakeGetTasksFor(EXPECTED_QUERY, [
      { Message: "Hello!", Cohorts: ["55", "56"] }
    ]);
    const generator = new ArbitraryMessageGenerator(getTasks, cohortLookup);
    const messages = await generator.produce(NOW);
    expect(messages).toEqual([
      new Message("Hello!", "#january2018"),
      new Message("Hello!", "#february2018")
    ]);
  });

  it("ignores tasks with no cohorts", async () => {
    const getTasks = fakeGetTasksFor(EXPECTED_QUERY, [{ Message: "Hello!", Cohorts: undefined }]);
    const generator = new ArbitraryMessageGenerator(getTasks, cohortLookup);
    const messages = await generator.produce(NOW);
    expect(messages).toEqual([]);
  });
});

describe("#markComplete", async () => {
  const completedItems = [];
  const markCompleter = id =>
    new Promise(resolve => {
      completedItems.push(id);
      resolve();
    });
  const generator = new ArbitraryMessageGenerator(() => {}, () => {}, markCompleter);
  const message = new Message("Hello!", "#january2018", 4);
  await generator.markComplete(message);
  expect(completedItems).toContain(4);
});

const cohortLookup = async key => ({ "55": "january2018", "56": "february2018" }[key]);

const fakeGetTasksFor = (expectedQuery, value) => query => {
  if (query !== expectedQuery) {
    throw new Error(
      `Fake getTasks called with wrong query.\nGot ${query}\nExpected ${expectedQuery}`
    );
  }
  return value.map(fakeRecord);
};

const fakeRecord = (attributes = {}) => {
  return {
    get: key => attributes[key]
  };
};
