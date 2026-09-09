import { MeetingScheduleService } from './meeting-schedule.service';
import { Model } from 'mongoose';
describe('pre-meeting workflow', () => {
  it('rejects pending and rejected requests', async () => {
    for (const status of ['pending', 'rejected']) {
      const create = jest.fn();
      const service = new MeetingScheduleService(
        { create } as unknown as Model<any>,
        {
          findById: jest.fn(async () => ({ status })),
        } as unknown as Model<any>,
        {} as Model<any>,
        {} as Model<any>,
      );
      await expect(
        service.scheduleMeeting('request', {
          date: '2026-10-01',
          time: '12:00',
          meetingLink: 'https://example.com',
        }),
      ).rejects.toThrow();
      expect(create).not.toHaveBeenCalled();
    }
  });
  it('records completion only from scheduled state with an accepted request', async () => {
    const update = jest.fn(async () => ({ status: 'completed' }));
    const service = new MeetingScheduleService(
      {
        findById: jest.fn(async () => ({
          _id: 'meeting',
          requestId: 'request',
          status: 'scheduled',
        })),
        findOneAndUpdate: update,
      } as unknown as Model<any>,
      {
        findById: jest.fn(async () => ({ status: 'accepted' })),
      } as unknown as Model<any>,
      {} as Model<any>,
      {} as Model<any>,
    );
    await expect(
      service.changeMeetingStatus('meeting', 'invalid'),
    ).rejects.toThrow();
    await service.changeMeetingStatus('meeting', 'completed');
    expect(update).toHaveBeenCalledWith(
      { _id: 'meeting', status: 'scheduled' },
      { $set: { status: 'completed', completedAt: expect.any(Date) } },
      expect.any(Object),
    );
  });
});
