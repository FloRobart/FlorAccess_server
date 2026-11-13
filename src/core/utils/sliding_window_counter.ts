/**
 * Counts the events of the last time window, to cap how many of them can happen during this window.
 *
 * The window slides: an event stops counting exactly one window after it happened,
 * so that the limit can never be exceeded by spreading the events around a fixed reset time.
 * The events are kept in memory: the counts start again from zero when the server restarts.
 */
export class SlidingWindowCounter {
    private eventDates: number[] = [];


    /**
     * @param maxEvents Number of events allowed during one window
     * @param windowInMilliseconds Duration of the window
     */
    constructor(
        private readonly maxEvents: number,
        private readonly windowInMilliseconds: number,
    ) {}


    /**
     * Checks if one more event can happen now, without counting it.
     * @returns True if the limit is not reached
     */
    hasCapacity(): boolean {
        return this.getRemainingCapacity() > 0;
    }


    /**
     * Counts how many more events can happen now, without counting any.
     * @returns Number of events still allowed during the current window
     */
    getRemainingCapacity(): number {
        this.forgetExpiredEvents();

        return Math.max(this.maxEvents - this.eventDates.length, 0);
    }


    /**
     * Counts one event, unless the limit is reached.
     * @returns True if the event was counted, false if the limit is reached
     */
    tryRecordEvent(): boolean {
        if (!this.hasCapacity()) { return false; }

        this.eventDates.push(Date.now());
        return true;
    }


    /**
     * Forgets the events which happened before the current window.
     * The dates are stored in chronological order, so the expired ones are always at the start.
     */
    private forgetExpiredEvents(): void {
        const windowStart = Date.now() - this.windowInMilliseconds;
        const firstEventInWindow = this.eventDates.findIndex((eventDate: number) => eventDate > windowStart);

        if (firstEventInWindow === -1) {
            this.eventDates = [];
            return;
        }

        this.eventDates = this.eventDates.slice(firstEventInWindow);
    }
}
