import DailyGenerator from "./DailyGenerator";
import Message from "../Message";

const subGenerator = (timestamp, id) => [new Message(`Hello ${timestamp}`, "#coaches", id)];

describe("#produce", () => {
  it("produces no message before the trigger time", async () => {
    const beforeTime = +new Date(2018, 1, 1, 7, 0);
    const relevantTime = +new Date(2018, 1, 1, 9, 0);
    const generator = new DailyGenerator(9, 0, subGenerator);
    expect(await generator.produce(beforeTime)).toEqual([]);
  });

  it("produces no message 10 minutes after the trigger time", async () => {
    const beforeTime = +new Date(2018, 1, 1, 9, 11);
    const relevantTime = +new Date(2018, 1, 1, 9, 0);
    const generator = new DailyGenerator(9, 0, subGenerator);
    expect(await generator.produce(beforeTime)).toEqual([]);
  });

  it("generates a messsage at the trigger time", async () => {
    const relevantTime = +new Date(2018, 1, 1, 9, 0);
    const generator = new DailyGenerator(9, 0, subGenerator);
    expect(await generator.produce(relevantTime)).toEqual([
      new Message("Hello 1517475600000", "#coaches", expect.anything())
    ]);
    expect(await generator.produce(relevantTime + 1000)).toEqual([
      new Message("Hello 1517475601000", "#coaches", expect.anything())
    ]);
  });
});

describe("#markComplete", () => {
  it("does not repeat that day when marked complete", async () => {
    const relevantTime = +new Date(2018, 1, 1, 9, 0);
    const generator = new DailyGenerator(9, 0, subGenerator);
    const messages = await generator.produce(relevantTime);
    await generator.markComplete(messages[0]);
    expect(await generator.produce(relevantTime)).toEqual([]);
    expect(await generator.produce(relevantTime + 10000)).toEqual([]);
  });

  it("repeats after a day has elapsed", async () => {
    const relevantTime = +new Date(2018, 1, 1, 9, 0);
    const dayLater = +new Date(2018, 1, 2, 9, 0);
    const generator = new DailyGenerator(9, 0, subGenerator);
    const messages = await generator.produce(relevantTime);
    await generator.markComplete(messages[0]);
    expect(await generator.produce(dayLater)).toEqual([
      new Message("Hello 1517562000000", "#coaches", expect.anything())
    ]);
  });

  it("does not repeat after a day has elapsed before the trigger time", async () => {
    const relevantTime = +new Date(2018, 1, 1, 9, 0);
    const dayLater = +new Date(2018, 1, 2, 8, 0);
    const generator = new DailyGenerator(9, 0, subGenerator);
    const messages = await generator.produce(relevantTime);
    await generator.markComplete(messages[0]);
    expect(await generator.produce(dayLater)).toEqual([]);
  });
});
