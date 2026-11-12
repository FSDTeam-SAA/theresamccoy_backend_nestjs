import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateMyBookkeeperProfileDto } from './bookkeeper-profile.dto';

describe('UpdateMyBookkeeperProfileDto', () => {
  it('parses multipart JSON arrays and numeric fields', async () => {
    const dto = plainToInstance(UpdateMyBookkeeperProfileDto, {
      skills: '["Xero","Payroll"]',
      languages: '["English","Mandarin"]',
      certifications: '[{"title":"Xero Advisor","year":2024}]',
      portfolio: '[{"title":"E-commerce reconciliation"}]',
      hourlyRate: '85.5',
      projectsCompleted: '63',
    });

    await expect(validate(dto, { whitelist: true })).resolves.toHaveLength(0);
    expect(dto.skills).toEqual(['Xero', 'Payroll']);
    expect(dto.certifications?.[0].year).toBe(2024);
    expect(dto.hourlyRate).toBe(85.5);
    expect(dto.projectsCompleted).toBe(63);
  });

  it('rejects malformed nested profile data', async () => {
    const dto = plainToInstance(UpdateMyBookkeeperProfileDto, {
      certifications: '[{"year":1800}]',
      hourlyRate: '-5',
    });

    const errors = await validate(dto, { whitelist: true });
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['certifications', 'hourlyRate']),
    );
  });
});
