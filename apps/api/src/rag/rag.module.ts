import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { RetrievalService } from './retrieval.service';

@Module({
  controllers: [RagController],
  providers: [RagService, RetrievalService],
})
export class RagModule { }
