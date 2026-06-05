import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CommentRepliesService } from './comment_replies.service';
import { CommentReplies } from './entities/comment_replies.entity';
import { CommentRepliesCreateDto } from './dto/create-comment_replies.dto';
import { CommentRepliesUpdateDto } from './dto/update-comment_replies.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("Comment Replies")
@Controller('api/v1/comment-replies')
export class CommentRepliesController {
  constructor(private readonly service: CommentRepliesService) {}

  @Post()
  create(@Body() dto: CommentRepliesCreateDto): Promise<CommentReplies> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<CommentReplies[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CommentReplies> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CommentRepliesUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
