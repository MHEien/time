import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import sanitizeHtml from 'sanitize-html';
import superjson from 'superjson';
import { vectorStore } from "./openai";

const stringify = superjson.stringify;

export interface EmbeddableData {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
}

function processContent(item: EmbeddableData) {
  switch (item.type) {
    case 'pr':
    case 'commit':
      return stringify(item.content);
    case 'code':
      return item.content; // Preserve code structure
    default:
      return sanitizeHtml(stringify(item.content), {
        allowedTags: [],
        allowedAttributes: {},
      });
  }
}

export async function embedData(
  data: EmbeddableData[],
  batchSize = 100
) {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(data.length / batchSize)}`);

    const embeddingPromises = batch.map(async (item) => {
      try {
        const processedContent = processContent(item);

        let chunks;
        if (['pr', 'commit'].includes(item.type)) {
          chunks = [{ pageContent: processedContent }];
        } else {
          chunks = await textSplitter.createDocuments([processedContent]);
        }

        return Promise.all(chunks.map(async (chunk, index) => {
          const vectorId = await vectorStore.addDocuments([{
            pageContent: chunk.pageContent,
            metadata: { 
              type: item.type, 
              id: item.id,
              chunkIndex: index,
              totalChunks: chunks.length,
              contentType: typeof item.content === 'object' ? 'json' : 'text',
              ...item.metadata,
            },
          }]);
          console.log(`Embedded ${item.type} chunk ${index + 1}/${chunks.length} with id ${item.id} into vector store with id ${vectorId[0]}`);
          return vectorId[0];
        }));
      } catch (error) {
        console.error(`Error embedding ${item.type} with id ${item.id}:`, error);
        if (error instanceof SyntaxError) {
          console.error('JSON parsing error. Raw content:', item.content);
        }
        return [];
      }
    });

    await Promise.all(embeddingPromises);
  }
}

export async function retrieveEmbeddings(query: string, limit = 5) {
  try {
    const results = await vectorStore.similaritySearch(query, limit);
    return results.map(result => ({
      content: result.pageContent,
      metadata: result.metadata,
    }));
  } catch (error) {
    console.error(`Error retrieving embeddings for query "${query}":`, error);
    return [];
  }
}

export async function deleteEmbedding(id: string) {
  try {
    await vectorStore.delete({ ids: [id] });
    console.log(`Successfully deleted embedding with id ${id}`);
  } catch (error) {
    console.error(`Error deleting embedding with id ${id}:`, error);
  }
}

export async function updateEmbedding(id: string, newData: Partial<EmbeddableData>) {
  try {
    await deleteEmbedding(id);
    await embedData([{ ...newData, id } as EmbeddableData]);
    console.log(`Successfully updated embedding with id ${id}`);
  } catch (error) {
    console.error(`Error updating embedding with id ${id}:`, error);
  }
}