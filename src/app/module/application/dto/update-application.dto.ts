import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentDto } from './create-application.dto';

export class UpdateApplicationDto extends PartialType(CreateAssessmentDto) {}
