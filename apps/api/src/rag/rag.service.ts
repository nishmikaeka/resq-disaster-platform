import { Injectable } from '@nestjs/common';
import { RetrievalService, Message } from './retrieval.service';

@Injectable()
export class RagService {
  // sessionId → message history
  // In-memory is fine for a demo project
  private sessions = new Map<string, Message[]>();

  constructor(private retrievalService: RetrievalService) {}

  async ask(question: string, sessionId: string) {
    // Get or create history for this session
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    const history = this.sessions.get(sessionId)!;

    const { answer, sources } = await this.retrievalService.ask(
      question,
      history,
    );

    // Save this exchange to history
    history.push({ role: 'user', content: question });
    history.push({ role: 'assistant', content: answer });

    // Cap history at 20 messages (10 exchanges) so memory doesn't grow forever
    if (history.length > 20) {
      history.splice(0, 2); // remove oldest exchange
    }

    return { answer, sources, sessionId };
  }

  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}
