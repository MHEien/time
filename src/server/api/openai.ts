import { env } from "@/env";
import { OpenAIEmbeddings } from "@langchain/openai";
import Openai from "openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";

export const openai = new Openai({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION ?? undefined,
});

export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

export const pinecone = new PineconeClient({
  apiKey: env.PINECONE_API_KEY,
});

export const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex: pinecone.Index(env.PINECONE_INDEX),
  // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
  maxConcurrency: 5,
  // You can pass a namespace here too
  // namespace: "foo",
});