declare module 'luxon' {
  export interface DateTimeOptions {
    zone?: string;
  }

  export class DateTime {
    readonly isValid: boolean;

    private constructor(date: Date, isValid?: boolean);

    static utc(): DateTime;
    static fromISO(value: string, options?: DateTimeOptions): DateTime;

    startOf(unit: 'day'): DateTime;
    toUTC(): DateTime;
    toJSDate(): Date;
  }
}
