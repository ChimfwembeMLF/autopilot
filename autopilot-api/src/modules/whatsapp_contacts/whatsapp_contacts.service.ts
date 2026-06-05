import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappContacts } from './entities/whatsapp_contacts.entity';
import { WhatsappContactsCreateDto } from './dto/create-whatsapp_contacts.dto';
import { WhatsappContactsUpdateDto } from './dto/update-whatsapp_contacts.dto';

@Injectable()
export class WhatsappContactsService {
  constructor(
    @InjectRepository(WhatsappContacts)
    private readonly repo: Repository<WhatsappContacts>,
  ) {}

  async create(dto: WhatsappContactsCreateDto): Promise<WhatsappContacts> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent as WhatsappContacts);
  }

  async findAll(): Promise<WhatsappContacts[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<WhatsappContacts> {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('WhatsappContacts not found');
    return ent;
  }

  async update(
    id: string,
    dto: WhatsappContactsUpdateDto,
  ): Promise<WhatsappContacts> {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0)
      throw new NotFoundException('WhatsappContacts not found');
  }
}
