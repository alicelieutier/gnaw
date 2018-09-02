import getTasks from "../getTasks";
import makeSlackHandleLookup from "../makeSlackHandleLookup";
import Message from "../Message";
import makeCoachSummary from "../makeCoachSummary";
import WeekdailyGenerator from "../message_generators/WeekdailyGenerator";

export default base => [
  new WeekdailyGenerator(9, 0, async (timestamp, id) => {
    const handleLookup = await makeSlackHandleLookup(base);
    const message = await makeCoachSummary(
      timestamp,
      (view, formula) => getTasks(base, view, formula),
      handleLookup
    );
    return [new Message(message, "#apprs-coaching", id)];
  })
];
