import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { WhatsappContactsService } from './whatsapp_contacts.service';
import { WhatsappContacts } from './entities/whatsapp_contacts.entity';
import { WhatsappContactsCreateDto } from './dto/create-whatsapp_contacts.dto';
import { WhatsappContactsUpdateDto } from './dto/update-whatsapp_contacts.dto';

@Controller('whatsapp_contacts')
export class WhatsappContactsController {
  constructor(private readonly service: WhatsappContactsService) {}

  @Post()
  create(@Body() dto: WhatsappContactsCreateDto): Promise<WhatsappContacts> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<WhatsappContacts[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<WhatsappContacts> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: WhatsappContactsUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
