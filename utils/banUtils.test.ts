import { calculateRemainingBanDuration, formatRemainingBanDuration } from './banUtils';
import { TournamentConfig } from '@/lib/types';

describe('banUtils', () => {
  describe('calculateRemainingBanDuration', () => {
    it('should return not banned for player without ban', () => {
      const player = { isBanned: false };
      const tournaments: TournamentConfig[] = [];
      
      const result = calculateRemainingBanDuration(player, tournaments);
      
      expect(result.isBanned).toBe(false);
      expect(result.isExpired).toBe(false);
    });

    it('should calculate remaining duration correctly', () => {
      const player = {
        isBanned: true,
        banDuration: 5,
        bannedAt: '2024-01-01T00:00:00.000Z'
      };
      
      const tournaments: TournamentConfig[] = [
        { id: '1', title: 'Tournament 1', startDate: '2024-01-15T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-01-15T00:00:00.000Z' },
        { id: '2', title: 'Tournament 2', startDate: '2024-01-30T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-01-30T00:00:00.000Z' },
        { id: '3', title: 'Tournament 3', startDate: '2024-02-15T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-02-15T00:00:00.000Z' },
      ];
      
      const result = calculateRemainingBanDuration(player, tournaments);
      
      expect(result.isBanned).toBe(true);
      expect(result.remainingDuration).toBe(2); // 5 - 3 = 2
      expect(result.isExpired).toBe(false);
    });

    it('should mark ban as expired when duration is exceeded', () => {
      const player = {
        isBanned: true,
        banDuration: 2,
        bannedAt: '2024-01-01T00:00:00.000Z'
      };
      
      const tournaments: TournamentConfig[] = [
        { id: '1', title: 'Tournament 1', startDate: '2024-01-15T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-01-15T00:00:00.000Z' },
        { id: '2', title: 'Tournament 2', startDate: '2024-01-30T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-01-30T00:00:00.000Z' },
        { id: '3', title: 'Tournament 3', startDate: '2024-02-15T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-02-15T00:00:00.000Z' },
      ];
      
      const result = calculateRemainingBanDuration(player, tournaments);
      
      expect(result.isBanned).toBe(true);
      expect(result.remainingDuration).toBe(0);
      expect(result.isExpired).toBe(true);
    });

    it('should ignore tournaments created before ban', () => {
      const player = {
        isBanned: true,
        banDuration: 3,
        bannedAt: '2024-02-01T00:00:00.000Z'
      };
      
      const tournaments: TournamentConfig[] = [
        { id: '1', title: 'Tournament 1', startDate: '2024-01-15T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-01-15T00:00:00.000Z' },
        { id: '2', title: 'Tournament 2', startDate: '2024-02-15T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-02-15T00:00:00.000Z' },
        { id: '3', title: 'Tournament 3', startDate: '2024-03-01T00:00:00.000Z', whatsappLink: '', notificationTime: '', createdAt: '2024-03-01T00:00:00.000Z' },
      ];
      
      const result = calculateRemainingBanDuration(player, tournaments);
      
      expect(result.isBanned).toBe(true);
      expect(result.remainingDuration).toBe(1); // 3 - 2 = 1 (only tournaments after ban date)
      expect(result.isExpired).toBe(false);
    });
  });

  describe('formatRemainingBanDuration', () => {
    it('should format single tournament correctly', () => {
      expect(formatRemainingBanDuration(1)).toBe('1 tournament');
    });

    it('should format multiple tournaments correctly', () => {
      expect(formatRemainingBanDuration(3)).toBe('3 tournaments');
    });

    it('should handle expired ban', () => {
      expect(formatRemainingBanDuration(0)).toBe('Expired');
    });

    it('should handle negative values', () => {
      expect(formatRemainingBanDuration(-1)).toBe('Expired');
    });
  });
});
