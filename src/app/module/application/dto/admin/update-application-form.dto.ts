import { PartialType } from '@nestjs/swagger';

import { CreateApplicationFormDto } from './create-application-form.dto';

export class UpdateApplicationFormDto extends PartialType(
  CreateApplicationFormDto,
) {}
