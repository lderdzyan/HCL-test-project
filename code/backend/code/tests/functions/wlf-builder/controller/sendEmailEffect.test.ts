import { Effect } from 'effect';
import { WlfBuilderController } from '@/lib/controllers/wlf-builder';

import { findAllMfaProfilesByPid } from '@/lib/entities/mfa-profile';
import { findEmailByMfaProfileId } from '@/lib/entities/email';
import { findAllUsersByPidAndEmail } from '@/lib/entities/user-profile';
import { findPersonById } from '@/lib/entities/person';
import { publishMessage } from '@/lib/publish-message';
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
  __esModule: true,
  default: { host: 'https://example.test' },
}));

jest.mock('@/lib/constants', () => ({
  SUPPORT_LINK: 'https://support.example.test',
}));

const mockedFindMfa = findAllMfaProfilesByPid as jest.MockedFunction<typeof findAllMfaProfilesByPid>;
const mockedFindEmail = findEmailByMfaProfileId as jest.MockedFunction<typeof findEmailByMfaProfileId>;
const mockedFindUsers = findAllUsersByPidAndEmail as jest.MockedFunction<typeof findAllUsersByPidAndEmail>;
const mockedFindPerson = findPersonById as jest.MockedFunction<typeof findPersonById>;
const mockedPublish = publishMessage as jest.MockedFunction<typeof publishMessage>;

describe('sendEmailEffect', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('happy path: sends email for first matching profile and returns early', async () => {
    // 2 MFA profiles; first email inactive, second active & matches user+person
    mockedFindMfa.mockResolvedValue([
      { id: 'mfa-1' } as any,
      { id: 'mfa-2' } as any,
      { id: 'mfa-3-should-not-be-visited' } as any,
    ]);

    // For mfa-1 → inactive email
    mockedFindEmail.mockImplementation(async (mfaId: string) => {
      if (mfaId === 'mfa-1') return { emailAddr: 'a@ex.test', active: false } as any;
      if (mfaId === 'mfa-2') return { emailAddr: 'user@ex.test', active: true } as any;
      // If we ever get here, the loop didn't early-return:
      if (mfaId === 'mfa-3-should-not-be-visited') throw new Error('Should not query 3rd MFA profile');
      return undefined;
    });

    mockedFindUsers.mockImplementation(async (_pid, email) => {
      if (email === 'user@ex.test') return [{ email: 'user@ex.test', personId: pid }] as any;
      return [];
    });

    mockedFindPerson.mockResolvedValue({ id: pid } as any);

    mockedPublish.mockResolvedValue(undefined);

    await Effect.runPromise(WlfBuilderController.sendEmailEffect(pid));

    // Publish called exactly once with expected payload
    expect(mockedPublish).toHaveBeenCalledTimes(1);
    expect(mockedPublish).toHaveBeenCalledWith('send-email', {
      version: 1,
      to: ['user@ex.test'],
      subject: 'Welcome to the Worklife Fulfillment Builder & Next Steps!',
      template: 'wlf-builder-welcome',
      data: {
        wlf_builder_link: `${config.host}/tools/builder/`,
        support_page_link: SUPPORT_LINK,
      },
    });

    // Ensure we never looked up the 3rd MFA profile (early return)
    expect(mockedFindEmail.mock.calls.map((c) => c[0])).toEqual(['mfa-1', 'mfa-2']);
  });

  it('does nothing when there are no MFA profiles', async () => {
    mockedFindMfa.mockResolvedValue([]);
    await Effect.runPromise(WlfBuilderController.sendEmailEffect(pid));
    expect(mockedFindEmail).not.toHaveBeenCalled();
    expect(mockedFindUsers).not.toHaveBeenCalled();
    expect(mockedFindPerson).not.toHaveBeenCalled();
    expect(mockedPublish).not.toHaveBeenCalled();
  });

  it('does nothing when email is inactive', async () => {
    mockedFindMfa.mockResolvedValue([{ id: 'mfa-1' }] as any);
    mockedFindEmail.mockResolvedValue({ emailAddr: 'x@ex.test', active: false } as any);

    await Effect.runPromise(WlfBuilderController.sendEmailEffect(pid));

    expect(mockedFindUsers).not.toHaveBeenCalled();
    expect(mockedFindPerson).not.toHaveBeenCalled();
    expect(mockedPublish).not.toHaveBeenCalled();
  });

  it('does nothing when user list is empty', async () => {
    mockedFindMfa.mockResolvedValue([{ id: 'mfa-1' }] as any);
    mockedFindEmail.mockResolvedValue({ emailAddr: 'x@ex.test', active: true } as any);
    mockedFindUsers.mockResolvedValue([]);

    await Effect.runPromise(WlfBuilderController.sendEmailEffect(pid));

    expect(mockedFindPerson).not.toHaveBeenCalled();
    expect(mockedPublish).not.toHaveBeenCalled();
  });

  it('does nothing when person does not match the user.personId', async () => {
    mockedFindMfa.mockResolvedValue([{ id: 'mfa-1' }] as any);
    mockedFindEmail.mockResolvedValue({ emailAddr: 'x@ex.test', active: true } as any);
    mockedFindUsers.mockResolvedValue([{ email: 'x@ex.test', personId: 'someone-else' }] as any);
    mockedFindPerson.mockResolvedValue({ id: pid } as any);

    await Effect.runPromise(WlfBuilderController.sendEmailEffect(pid));

    expect(mockedPublish).not.toHaveBeenCalled();
  });

  it('fails (rejects) when publishMessage rejects', async () => {
    mockedFindMfa.mockResolvedValue([{ id: 'mfa-1' }] as any);
    mockedFindEmail.mockResolvedValue({ emailAddr: 'user@ex.test', active: true } as any);
    mockedFindUsers.mockResolvedValue([{ email: 'user@ex.test', personId: pid }] as any);
    mockedFindPerson.mockResolvedValue({ id: pid } as any);

    mockedPublish.mockRejectedValue(new Error('publish-failed'));

    await expect(Effect.runPromise(WlfBuilderController.sendEmailEffect(pid))).rejects.toThrow();
    expect(mockedPublish).toHaveBeenCalledTimes(1);
  });
});
