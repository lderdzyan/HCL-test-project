import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { none } from 'fp-ts/Option';
import { getPromoCodeByCode, PromoCode, PromoStatus } from '@/lib/entities/promo-service/promo-code';
import { findPromoUsageByUser } from '@/lib/entities/promo-service/promo-code-usage';
import { verifyGetPromoCode } from '@/functions/promo-service/handlers';
import { loadAllByPromoId } from '@/lib/entities/promo-service/promo-packages-assigned';

jest.mock('@/lib/entities/promo-service/promo-code');
jest.mock('@/lib/entities/promo-service/promo-code-usage');
jest.mock('@/lib/entities/promo-service/promo-packages-assigned');

const mockedGetPromoCodeByCode = getPromoCodeByCode as jest.MockedFunction<typeof getPromoCodeByCode>;
const mockedFindPromoUsageByUser = findPromoUsageByUser as jest.MockedFunction<typeof findPromoUsageByUser>;
const mockedLoadAllByPromoId = loadAllByPromoId as jest.MockedFunction<typeof loadAllByPromoId>;

const USER_ID = 'user-id';
const PROMO_CODE = 'PROMO123';
const now = Date.now();

const createPromoCode = (overrides?: Partial<PromoCode>): PromoCode =>
  ({
    id: 'promo1',
    promoCode: PROMO_CODE,
    status: PromoStatus.Active,
    startDate: now - 10000,
    expiration: now + 100000,
    leftCount: 10,
    usedRevenue: 50,
    revenueAmount: 100,
    usageCountPerUser: 1,
    ...overrides,
  }) as PromoCode;

const mockContext = () => ({
  req: { param: jest.fn() },
  var: { jwtPayload: { aud: USER_ID } },
  json: jest.fn(),
});

describe('verifyGetPromoCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return promoCode when everything is valid', async () => {
    const ctx = mockContext();
    ctx.req.param.mockReturnValue(PROMO_CODE);

    mockedGetPromoCodeByCode.mockReturnValue(TE.right(O.some(createPromoCode())));
    mockedFindPromoUsageByUser.mockReturnValue(TE.right(none));
    mockedLoadAllByPromoId.mockReturnValue(TE.right([{ packageId: 'package-id', mainPackageId: 'main-package-id' }]));

    // @ts-expect-error testing handler with void return type
    await verifyGetPromoCode(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        promoCode: expect.objectContaining({
          promoCode: PROMO_CODE,
          assigned: expect.arrayContaining([
            expect.objectContaining({
              packageId: 'package-id',
              mainPackageId: 'main-package-id',
            }),
          ]),
        }),
      }),
    );
  });

  describe('error cases', () => {
    const testCases = [
      {
        name: 'promo code does not exist',
        promoCode: 'INVALID',
        getPromoCodeMock: TE.right(none),
        expectedError: 'Promo code not exists.',
      },
      {
        name: 'promo code is expired',
        promoCode: 'EXPIRED_PROMO',
        getPromoCodeMock: TE.right(
          O.some(
            createPromoCode({
              promoCode: 'EXPIRED_PROMO',
              startDate: now - 20000,
              expiration: now - 1000,
            }),
          ),
        ),
        expectedError: 'Promo code is not valid.',
      },
      {
        name: 'promo code is not active',
        promoCode: 'INACTIVE_CODE',
        getPromoCodeMock: TE.right(
          O.some(
            createPromoCode({
              promoCode: 'INACTIVE_CODE',
              status: PromoStatus.Draft,
              expiration: now + 10000,
            }),
          ),
        ),
        expectedError: 'Promo code is not active.',
      },
      {
        name: 'promo code start date not met',
        promoCode: 'INACTIVE_CODE',
        getPromoCodeMock: TE.right(
          O.some(
            createPromoCode({
              promoCode: 'INACTIVE_CODE',
              startDate: now + 20000,
              expiration: now + 30000,
            }),
          ),
        ),
        expectedError: 'Promo code is not active yet.',
      },
      {
        name: 'promo code has no left count',
        promoCode: 'INACTIVE_CODE',
        getPromoCodeMock: TE.right(
          O.some(
            createPromoCode({
              promoCode: 'INACTIVE_CODE',
              leftCount: 0,
            }),
          ),
        ),
        expectedError: 'Promo code is not valid.',
      },
      {
        name: 'promo code revenue is used up',
        promoCode: 'INACTIVE_CODE',
        getPromoCodeMock: TE.right(
          O.some(
            createPromoCode({
              promoCode: 'INACTIVE_CODE',
              leftCount: 5,
              usedRevenue: 102,
              revenueAmount: 100,
            }),
          ),
        ),
        expectedError: 'Promo code is not valid.',
      },
      {
        name: 'promo code usage per user is met',
        promoCode: 'INACTIVE_CODE',
        getPromoCodeMock: TE.right(
          O.some(
            createPromoCode({
              promoCode: 'INACTIVE_CODE',
              leftCount: 5,
            }),
          ),
        ),
        findPromoUsageMock: TE.right(
          O.some({ promoCodeId: 'promo1', lastUsedAt: now - 20000, pid: USER_ID, usageCount: 1 }),
        ),
        expectedError: 'User usage limit expired.',
      },
    ];

    testCases.forEach(({ name, promoCode, getPromoCodeMock, findPromoUsageMock = TE.right(none), expectedError }) => {
      it(`should return error when ${name}`, async () => {
        const ctx = mockContext();
        ctx.req.param.mockReturnValue(promoCode);

        mockedGetPromoCodeByCode.mockReturnValue(getPromoCodeMock);
        mockedFindPromoUsageByUser.mockReturnValue(findPromoUsageMock);

        // @ts-expect-error testing handler with void return type
        await verifyGetPromoCode(ctx);

        expect(ctx.json).toHaveBeenCalledWith({ error: new Error(expectedError) }, 400);
      });
    });
  });
});
