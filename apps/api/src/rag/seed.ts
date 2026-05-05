import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index('resq-rag');

function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;

    // If the next start point is already past the end of the text, stop.
    if (i >= text.length) break;
  }
  return chunks;
}

async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: 'RETRIEVAL_DOCUMENT' as any,
  });
  return result.embedding.values;
}

async function seedPDF(filePath: string) {
  const filename = path.basename(filePath);
  console.log(`\nSeeding: ${filename}`);

  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  const chunks = chunkText(parsed.text);

  console.log(`  ${chunks.length} chunks found`);

  // Batch into groups of 50 to avoid rate limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const vectors = await Promise.all(
      batch.map(async (text, j) => ({
        id: `${filename}_chunk_${i + j}`,
        values: await embedText(text),
        metadata: {
          source: filename,
          chunkIndex: i + j,
          text, // store raw text so we can retrieve it later
        },
      })),
    );

    await index.upsert({ records: vectors });
    console.log(`  Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }

  console.log(`  Done: ${filename}`);
}

async function main() {
  const assetsDir = path.join(__dirname, '../assets');
  const files = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.pdf'));

  if (files.length === 0) {
    console.error('No PDFs found in src/assets/');
    process.exit(1);
  }

  // Check if index exists, create if not
  const indexName = 'resq-rag';
  const indexes = await pc.listIndexes();
  const indexExists = indexes.indexes?.some((idx) => idx.name === indexName);

  if (!indexExists) {
    console.log(`Creating index: ${indexName}...`);
    await pc.createIndex({
      name: indexName,
      dimension: 768, // Dimension for gemini-embedding-001
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
    // Wait for index to be ready
    console.log('Waiting for index to be ready...');
    await new Promise((resolve) => setTimeout(resolve, 60000)); // 60 seconds
  }

  for (const file of files) {
    await seedPDF(path.join(assetsDir, file));
  }

  console.log('\nAll PDFs seeded successfully.');
}

main().catch(console.error);
