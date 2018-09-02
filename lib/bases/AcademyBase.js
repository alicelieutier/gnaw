import Airtable from "airtable";
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const ACADEMY_AIRTABLE_BASE_ID = process.env.ACADEMY_AIRTABLE_BASE_ID;

Airtable.configure({
  apiKey: AIRTABLE_API_KEY
});

const base = Airtable.base(ACADEMY_AIRTABLE_BASE_ID);

export default base;
