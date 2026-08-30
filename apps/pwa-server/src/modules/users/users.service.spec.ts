import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let prisma: any;
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
    };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('getMe fetches the user by id', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ id: 1 });
    await expect(service.getMe(1)).resolves.toEqual({ id: 1 });
    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('updateSettings updates only the provided fields', async () => {
    prisma.user.update.mockResolvedValue({ id: 1, baseCurrency: 'usd' });
    await service.updateSettings(1, { baseCurrency: 'usd' as any });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { baseCurrency: 'usd' },
    });
  });
});
