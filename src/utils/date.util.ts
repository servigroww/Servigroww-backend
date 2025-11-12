import { format, addDays, addHours, addMinutes } from 'date-fns';

export class DateUtil {
  static formatDateTime(date: Date): string {
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  }

  static formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  static addDays(date: Date, days: number): Date {
    return addDays(date, days);
  }

  static addHours(date: Date, hours: number): Date {
    return addHours(date, hours);
  }

  static addMinutes(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
  }
}