import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class RetrievalService {
  private genAI: GoogleGenerativeAI;
  private pc: Pinecone;
  private index: any;

  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GOOGLE_AI_KEY')!,
    );
    this.pc = new Pinecone({
      apiKey: this.configService.get<string>('PINECONE_API_KEY')!,
    });
    this.index = this.pc.index('resq-rag');
  }

  private async embedQuestion(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-embedding-001',
    });
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      taskType: 'RETRIEVAL_QUERY' as any,
    });
    return result.embedding.values;
  }

  private async reformulateQuery(
    question: string,
    history: Message[],
  ): Promise<string> {
    if (history.length === 0) return question;

    const historyText = history
      .slice(-4)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `Given the following conversation history and a follow-up question, rephrase the follow-up question to be a standalone search query that captures the full context of the user's information need.
    
    CONVERSATION HISTORY:
    ${historyText}
    
    FOLLOW-UP QUESTION: ${question}
    
    Standalone query:`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
    });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  private async retrieveChunks(question: string) {
    const vector = await this.embedQuestion(question);
    const results = await this.index.query({
      vector,
      topK: 5,
      includeMetadata: true,
    });

    // Only use chunks we're actually confident about
    return results.matches.filter((m) => (m.score ?? 0) >= 0.5);
  }

  private buildPrompt(
    question: string,
    chunks: any[],
    history: Message[],
  ): string {
    const context = chunks
      .map(
        (m, i) => `[Source ${i + 1}: ${m.metadata.source}]\n${m.metadata.text}`,
      )
      .join('\n\n---\n\n');

    // Last 3 exchanges only — keeps context window tight
    const recentHistory = history.slice(-6); // 3 user + 3 assistant
    const historyText = recentHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    return `You are an emergency response assistant for ResQ, a disaster relief platform.
Use ONLY the context below to answer. Never invent information — lives depend on accuracy.
If the answer is not in the context, say exactly: "I don't have specific guidance on that."
Never give medical diagnoses. Always recommend calling emergency services for life-threatening situations.

CONTEXT FROM KNOWLEDGE BASE:
${context}

${recentHistory.length > 0 ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}
CURRENT QUESTION: ${question}

Answer clearly and mention which source(s) you used.`;
  }

  async ask(
    question: string,
    history: Message[],
  ): Promise<{ answer: string; sources: any[] }> {
    // 1. Reformulate question using history to get a standalone query
    const retrievalQuery = await this.reformulateQuery(question, history);

    // 2. Retrieve chunks based on the reformulated query
    const chunks = await this.retrieveChunks(retrievalQuery);

    if (chunks.length === 0) {
      return {
        answer:
          "I don't have specific guidance on that in my knowledge base. For emergencies, please call your local emergency services immediately.",
        sources: [],
      };
    }

    const prompt = this.buildPrompt(question, chunks, history);
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
    });
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    const sources = chunks.map((m) => ({
      title: (m.metadata?.source as string) || 'Unknown',
      chunkIndex: (m.metadata?.chunkIndex as number) || 0,
      relevanceScore: Math.round((m.score ?? 0) * 100),
    }));

    return { answer, sources };
  }
}
