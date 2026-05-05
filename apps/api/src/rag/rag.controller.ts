import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RagService } from './rag.service';
import { AskDto } from './dto/ragAsk.dto';

@Controller('rag')
export class RagController {
  constructor(private ragService: RagService) {}

  @UseGuards(JwtGuard)
  @Post('ask')
  ask(@Body() body: AskDto) {
    return this.ragService.ask(body.question, body.sessionId);
  }

  // let frontend clear history when user starts a new chat
  @UseGuards(JwtGuard)
  @Delete('session/:id')
  clearSession(@Param('id') id: string) {
    this.ragService.clearSession(id);
    return { cleared: true };
  }
}
