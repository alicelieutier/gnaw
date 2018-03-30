import DailyGenerator from "./DailyGenerator";
import Message from "../Message";

const subGenerator = id => [new Message("Hello", "#coaches", id)];

describe("#produce", () => {
  it("produces no message before the trigger time", async () => {
    const beforeTime = +new Date(2018, 1, 1, 7, 0);
    const relevantTime = +new Date(2018, 1, 1, 9, 0);
    const generator = new DailyGenerator(9, 0, subGenerator);
    expect(await generator.produce(beforeTime)).toEqual([]);
  });

  it("generates a messsage at a relevant time", async () => {
    const relevantTime = +new Date(2018, 1, 1, 9, 0);
    const generator = new DailyGenerator(9, 0, subGenerator);
    expect(await generator.produce(relevantTime)).toEqual([
      new Message("Hello", "#coaches", expect.anything())
    ]);
    expect(await generator.produce(relevantTime + 1000)).toEqual([
      new Message("Hello", "#coaches", expect.anything())
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
      new Message("Hello", "#coaches", expect.anything())
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
