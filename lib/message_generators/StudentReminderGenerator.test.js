import StudentReminderGenerator from "./StudentReminderGenerator";
import Message from "../Message";

const NOW = 1521032816573;
const EXPECTED_QUERY =
  "AND(DATETIME_DIFF({Start time}, 1521032816573, 'minutes') < 10, DATETIME_DIFF({Start time}, 1521032816573, 'minutes') > 0, {Visible to students?} = 1, {Reminder given?} = 0)";

describe("#produce", () => {
  it("returns messages for the events in the next 10 minutes", async () => {
    const getTasks = fakeGetTasksFor(EXPECTED_QUERY, [
      { Name: "Retro", "Start time": NOW + 60000 * 9, Cohorts: ["55"] },
      { Name: "Metro", "Start time": NOW + 60000 * 10, Cohorts: ["56"] }
    ]);
    const generator = new StudentReminderGenerator(getTasks, cohortLookup);
    const messages = await generator.produce(NOW);
    expect(messages).toEqual([
      new Message("<!channel> Retro starting in 9 minutes!", "#january2018"),
      new Message("<!channel> Metro starting in 10 minutes!", "#february2018")
    ]);
  });

  it("returns messages when an event has multiple cohorts", async () => {
    const getTasks = fakeGetTasksFor(EXPECTED_QUERY, [
      { Name: "Retro", "Start time": NOW + 60000 * 9, Cohorts: ["55", "56"] }
    ]);
    const generator = new StudentReminderGenerator(getTasks, cohortLookup);
    const messages = await generator.produce(NOW);
    expect(messages).toEqual([
      new Message("<!channel> Retro starting in 9 minutes!", "#january2018"),
      new Message("<!channel> Retro starting in 9 minutes!", "#february2018")
    ]);
  });

  it("ignores tasks with no cohorts", async () => {
    const getTasks = fakeGetTasksFor(EXPECTED_QUERY, [
      { Name: "Retro", "Start time": NOW + 60000 * 9, Cohorts: undefined }
    ]);
    const generator = new StudentReminderGenerator(getTasks, cohortLookup);
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
  const generator = new StudentReminderGenerator(() => {}, () => {}, markCompleter);
  const message = new Message("<!channel> Retro starting in 9 minutes!", "#january2018", 4);
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
