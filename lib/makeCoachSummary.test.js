import makeCoachSummary from "./makeCoachSummary";

it("produces a summary message", async () => {
  const timestamp = 500;
  const fakeGetTasks = async (view, formula) => {
    if (view !== "Upcoming") {
      throw new Error("Wrong view queried");
    }
    if (formula !== `IS_SAME({End time}, DATETIME_PARSE(${timestamp}, 'x'), 'day')`) {
      throw new Error(`Wrong formula used.`);
    }
    return [
      {
        get: field => {
          return {
            Coaches: [{ id: 4 }],
            "Start time": "2018-01-01T10:30",
            Name: "Jobhunters kickoff"
          }[field];
        }
      },
      {
        get: field => {
          return {
            Coaches: undefined,
            "External owner": undefined,
            "Start time": "2018-01-01T10:30",
            Name: "Code Review Workshop"
          }[field];
        }
      },
      {
        get: field => {
          return {
            Coaches: [{ id: 4 }, { id: 5 }],
            "Start time": "2018-01-01T11:00",
            Name: "Week 10 Kick Off"
          }[field];
        }
      },
      {
        get: field => {
          return {
            Coaches: undefined,
            "External owner": "Nikesh / Evgeny",
            "Start time": "2018-01-01T14:00",
            Name: "Super Announcement by Makers Academy"
          }[field];
        }
      }
    ];
  };

  const fakeLookupCoachHandle = id => {
    return {
      4: "<@UID123>",
      5: "<@UID234>"
    }[id];
  };

  const message = await makeCoachSummary(timestamp, fakeGetTasks, fakeLookupCoachHandle);
  expect(message).toEqual(
    [
      "Today's tasks:",
      "10.30: Jobhunters kickoff (<@UID123>)",
      "10.30: Code Review Workshop (*UNALLOCATED <!channel>*)",
      "11.00: Week 10 Kick Off (<@UID123>, <@UID234>)",
      "14.00: Super Announcement by Makers Academy (Nikesh / Evgeny)"
    ].join("\n")
  );
});
