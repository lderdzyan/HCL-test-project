import { findEmailByMfaProfileId } from '@/lib/entities/email';
import { findAllMfaProfilesByPid } from '@/lib/entities/mfa-profile';
import { findPersonById } from '@/lib/entities/person';
import { findAllUsersByPidAndEmail } from '@/lib/entities/user-profile';
import { publishMessage } from '@/lib/publish-message';
import { IndicatorController } from '@/lib/controllers/wlf-indicator';
import config from '@/config';
import { SUPPORT_LINK } from '@/lib/constants';

jest.mock('@/lib/entities/mfa-profile', () => ({
  findAllMfaProfilesByPid: jest.fn(),
}));

jest.mock('@/lib/entities/email', () => ({
  findEmailByMfaProfileId: jest.fn(),
}));

jest.mock('@/lib/entities/user-profile', () => ({
  findAllUsersByPidAndEmail: jest.fn(),
}));

jest.mock('@/lib/entities/person', () => ({
  findPersonById: jest.fn(),
}));

jest.mock('@/lib/publish-message', () => ({
  publishMessage: jest.fn(),
}));

jest.mock('@/config', () => ({
  config: { host: 'https://example.test' },
}));

jest.mock('@/lib/constants', () => ({
  SUPPORT_LINK: 'https://support.example.test',
}));

const mockFindAllMfaProfilesByPid = findAllMfaProfilesByPid as jest.MockedFunction<typeof findAllMfaProfilesByPid>;
const mockFindEmailByMfaProfileId = findEmailByMfaProfileId as jest.MockedFunction<typeof findEmailByMfaProfileId>;
const mockFindAllUsersByPidAndEmail = findAllUsersByPidAndEmail as jest.MockedFunction<
  typeof findAllUsersByPidAndEmail
>;
const mockFindPersonById = findPersonById as jest.MockedFunction<typeof findPersonById>;
const mockPublishMessage = publishMessage as jest.MockedFunction<typeof publishMessage>;

describe('sendEmail', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mfa = (id: string) => ({ id });
  const activeEmail = (addr: string) => ({ emailAddr: addr, active: true, mfaProfileId: '4444' });
  const inactiveEmail = (addr: string) => ({ emailAddr: addr, active: false, mfaProfileId: '5555' });
  const user = (email: string, personId: string) => ({ email, personId });
  const person = (id: string) => ({ id });

  it('happy path: publishes email and returns early', async () => {
    mockFindAllMfaProfilesByPid.mockResolvedValue([mfa('mfa-1'), mfa('mfa-2')]); // two profiles
    mockFindEmailByMfaProfileId
      .mockResolvedValueOnce(activeEmail('a@b.com')) // for mfa-1
      // would be called for mfa-2 if not early-returning:
      .mockResolvedValueOnce(activeEmail('x@y.com'));
    mockFindAllUsersByPidAndEmail.mockResolvedValue([user('a@b.com', pid)]); // user exists
    mockFindPersonById.mockResolvedValue(person(pid)); // person matches

    await IndicatorController.exportedForTesting.sendEmail(pid);

    expect(mockPublishMessage).toHaveBeenCalledTimes(1);
    expect(mockPublishMessage).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({
        subject: expect.stringContaining('The Worklife Fulfillment Indicator'),
        data: {
          wlf_link: `${config.host}/tools/indicator/#/training-plan/overview`,
          support_page_link: SUPPORT_LINK,
        },
        to: ['a@b.com'],
        template: 'wlf-indicator-welcome',
        version: 1,
      }),
    );
    // ensures early return: second profile should not be processed to publish again
    expect(mockFindEmailByMfaProfileId).toHaveBeenCalledTimes(1);
  });

  it('no MFA profiles → does nothing', async () => {
    mockFindAllMfaProfilesByPid.mockResolvedValue([]);

    await IndicatorController.exportedForTesting.sendEmail(pid);

    expect(mockPublishMessage).not.toHaveBeenCalled();
  });

  it('email inactive → skips', async () => {
    // Reset implementations as well as call counts
    jest.resetAllMocks();

    // Only one MFA profile so the function can’t fall through to another
    mockFindAllMfaProfilesByPid.mockResolvedValue([{ id: 'mfa-1' } as any]);

    mockFindEmailByMfaProfileId.mockResolvedValue({
      emailAddr: 'x@y.com',
      active: false,
    } as any);

    await IndicatorController.exportedForTesting.sendEmail('pid-123');

    expect(mockFindEmailByMfaProfileId).toHaveBeenCalledTimes(1);
    expect(mockFindAllUsersByPidAndEmail).not.toHaveBeenCalled();
    expect(mockPublishMessage).not.toHaveBeenCalled();
  });

  it('no user for that email → skips', async () => {
    mockFindAllMfaProfilesByPid.mockResolvedValue([mfa('mfa-1')]);
    mockFindEmailByMfaProfileId.mockResolvedValue(activeEmail('a@b.com'));
    mockFindAllUsersByPidAndEmail.mockResolvedValue([]);

    await IndicatorController.exportedForTesting.sendEmail(pid);

    expect(mockFindPersonById).not.toHaveBeenCalled();
    expect(mockPublishMessage).not.toHaveBeenCalled();
  });

  it('person mismatch → skips', async () => {
    mockFindAllMfaProfilesByPid.mockResolvedValue([mfa('mfa-1')]);
    mockFindEmailByMfaProfileId.mockResolvedValue(activeEmail('a@b.com'));
    mockFindAllUsersByPidAndEmail.mockResolvedValue([user('a@b.com', 'other-person')]);
    mockFindPersonById.mockResolvedValue(person(pid)); // person.id !== user[0].personId

    await IndicatorController.exportedForTesting.sendEmail(pid);

    expect(mockPublishMessage).not.toHaveBeenCalled();
  });

  it('tries next MFA profile if the first fails the checks, succeeds on the second', async () => {
    mockFindAllMfaProfilesByPid.mockResolvedValue([mfa('mfa-1'), mfa('mfa-2')]);
    // first profile: inactive
    mockFindEmailByMfaProfileId
      .mockResolvedValueOnce(inactiveEmail('a@b.com'))
      // second profile: active
      .mockResolvedValueOnce(activeEmail('x@y.com'));

    // for mfa-2 flow
    mockFindAllUsersByPidAndEmail.mockResolvedValue([user('x@y.com', pid)]);
    mockFindPersonById.mockResolvedValue(person(pid));

    await IndicatorController.exportedForTesting.sendEmail(pid);

    expect(mockPublishMessage).toHaveBeenCalledTimes(1);
    expect(mockPublishMessage).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({
        subject: expect.stringContaining('The Worklife Fulfillment Indicator'),
        data: {
          wlf_link: `${config.host}/tools/indicator/#/training-plan/overview`,
          support_page_link: SUPPORT_LINK,
        },
        to: ['x@y.com'],
        template: 'wlf-indicator-welcome',
        version: 1,
      }),
    );
  });

  it('handles findPersonById returning undefined (no person) → no publish', async () => {
    mockFindAllMfaProfilesByPid.mockResolvedValue([mfa('mfa-1')]);
    mockFindEmailByMfaProfileId.mockResolvedValue(activeEmail('a@b.com'));
    mockFindAllUsersByPidAndEmail.mockResolvedValue([user('a@b.com', pid)]);
    mockFindPersonById.mockResolvedValue(undefined as any);

    await IndicatorController.exportedForTesting.sendEmail(pid);

    expect(mockPublishMessage).not.toHaveBeenCalled();
  });
});
