import { IntersectionType, PartialType } from '@nestjs/swagger';
import {
  CreateBookkeeperAssessmentDto,
  CreateBookkeeperAvailabilityDto,
  CreateBookkeeperDto,
  CreateBookkeeperSkillsDto,
  CreateExperienceDto,
} from './create-bookkeeper.dto';

class CompleteBookkeeperDto extends IntersectionType(
  CreateBookkeeperDto,
  IntersectionType(
    CreateExperienceDto,
    IntersectionType(
      CreateBookkeeperSkillsDto,
      IntersectionType(
        CreateBookkeeperAssessmentDto,
        CreateBookkeeperAvailabilityDto,
      ),
    ),
  ),
) {}

export class UpdateBookkeeperDto extends PartialType(CompleteBookkeeperDto) {}
