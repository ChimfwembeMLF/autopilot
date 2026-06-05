import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageMetaDto } from 'src/common/dtos/page-meta.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import {
  FindManyOptions,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { SocialAuthRegisterDto } from '../auth/dtos/social-auth.dto';
import { UserRegisterDto } from '../auth/dtos/user-register.dto';
import { UserDto } from './dtos/user.dto';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async createUser(userRegisterDto: UserRegisterDto): Promise<UserEntity> {
    const user = this.userRepository.create(userRegisterDto);
    await this.userRepository.save(user);
    return user;
  }

  async createSociallAuthUser(
    socialAuthDto: SocialAuthRegisterDto,
  ): Promise<UserEntity> {
    const user = this.userRepository.create(socialAuthDto);
    await this.userRepository.save(user);
    return user;
  }
  /**
   * Find single user
   */
  findOne(findData: FindOptionsWhere<UserEntity>): Promise<UserEntity | null> {
    return this.userRepository.findOneBy(findData);
  }

  public async getUsers(
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, UserEntity[]]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder
      .orderBy('user.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  save(user: UserEntity): Promise<UserEntity> {
    return this.userRepository.save(user);
  }
}
