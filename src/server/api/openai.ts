import Openai from "openai";

export const openai = new Openai({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION ?? undefined,
});