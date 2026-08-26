import { PartialType } from '@nestjs/swagger';
import { CreateBookkeeperDto } from './create-bookkeeper.dto';

export class UpdateBookkeeperDto extends PartialType(CreateBookkeeperDto) {}
