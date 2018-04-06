import getFloorCover from "./getFloorCover";

it("returns an object denoting floor cover", async () => {
  const timestamp = 500;
  const fakeBase = FakeBase({
    table: "Third floor",
    view: "Grid view",
    formula: `IS_SAME({Date}, DATETIME_PARSE(${timestamp}, 'x'), 'day')`,
    records: [
      { Date: 500, Slot: "Morning (10am-1pm)", Coaches: [{ id: 1 }] },
      { Date: 500, Slot: "Morning (10am-1pm)", Coaches: [{ id: 2 }] },
      { Date: 500, Slot: "Afternoon (2pm-5pm)", Coaches: [{ id: 4 }, { id: 5 }] }
    ]
  });

  expect(await getFloorCover(fakeBase, timestamp)).toEqual({
    morning: [{ id: 1 }, { id: 2 }],
    afternoon: [{ id: 4 }, { id: 5 }]
  });
});

const FakeRecord = (attributes = {}) => {
  return {
    get: key => attributes[key]
  };
};

function FakeBase({ table, view, formula, records }) {
  const fakeRecords = records.map(FakeRecord);

  function create(givenTable) {
    if (table !== givenTable) {
      throw new Error(`Wrong table given (${givenTable} for ${table})`);
    }
    return { select };
  }

  function select({ view: givenView, filterByFormula: givenFormula }) {
    if (view !== givenView) {
      throw new Error(`Wrong view given (${givenView} for ${view})`);
    }
    if (formula !== givenFormula) {
      throw new Error(`Wrong formula given (${givenFormula} for ${formula})`);
    }
    return {
      firstPage: () => Promise.resolve(fakeRecords)
    };
  }

  return create;
}
