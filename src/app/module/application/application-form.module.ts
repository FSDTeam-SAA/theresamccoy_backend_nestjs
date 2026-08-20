import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import {
  ApplicationForm,
  ApplicationFormSchema,
} from './entities/application-form.entity';

import {
  ApplicationSubmission,
  ApplicationSubmissionSchema,
} from './entities/application-submission.entity';

import { ApplicationFormService } from './application-form.service';

import { ApplicationSubmissionService } from './application-submission.service';

import { AdminApplicationFormController } from './admin-application-form.controller';

import { ApplicationController } from './application.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ApplicationForm.name,
        schema: ApplicationFormSchema,
      },

      {
        name: ApplicationSubmission.name,
        schema: ApplicationSubmissionSchema,
      },
    ]),
  ],

  controllers: [AdminApplicationFormController, ApplicationController],

  providers: [ApplicationFormService, ApplicationSubmissionService],

  exports: [ApplicationFormService, ApplicationSubmissionService],
})
export class ApplicationFormModule {}
