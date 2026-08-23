import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSubmissionDto } from './create-submission.dto';

describe('CreateSubmissionDto', () => {
  it('retains table cell keys and arbitrary answer values with whitelist enabled', async () => {
    const dto = plainToInstance(CreateSubmissionDto, {
      candidateName: 'Saurav',
      date: '2026-08-23T06:32:36.737Z',
      positionName: 'Software Engineer',
      time: 45,
      formId: '6a86906a2a17aa1679a6b905',
      answers: [
        {
          questionId: '6a86906a2a17aa1679a6b90a',
          value: ['one', 'two'],
          subAnswers: [
            {
              subQuestionId: '6a86906a2a17aa1679a6b917',
              value: '=SUM(B2:B50)',
            },
          ],
          tableAnswers: [
            {
              rowId: '6a86906a2a17aa1679a6b90f',
              cells: [{ columnKey: 'calculation', value: 198.38 }],
            },
          ],
        },
      ],
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toEqual([]);
    expect(dto.date).toBeInstanceOf(Date);
    expect(dto.answers[0].value).toEqual(['one', 'two']);
    expect(dto.answers[0].subAnswers?.[0].value).toBe('=SUM(B2:B50)');
    expect(dto.answers[0].tableAnswers?.[0].cells[0]).toEqual({
      columnKey: 'calculation',
      value: 198.38,
    });
  });
});
