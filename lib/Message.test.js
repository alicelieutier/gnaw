import Message from "./Message";

test("constructs with attributes", () => {
  const message = new Message("This is a message", "#general", 5);
  expect(message.getBody()).toEqual("This is a message");
  expect(message.getDestination()).toEqual("#general");
  expect(message.getRecordId()).toEqual(5);
});
