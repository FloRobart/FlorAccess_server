import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SlidingWindowCounter } from "../../../src/core/utils/sliding_window_counter";



/**
 * Sliding window counter tests
 */
describe('Sliding window counter', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });


    it('Counts the events until the limit, then refuses them', () => {
        const counter = new SlidingWindowCounter(2, OneHour);

        expect(counter.tryRecordEvent()).toBe(true);
        expect(counter.tryRecordEvent()).toBe(true);
        expect(counter.tryRecordEvent()).toBe(false);
        expect(counter.hasCapacity()).toBe(false);
    });

    it('Checks the capacity without counting an event', () => {
        const counter = new SlidingWindowCounter(1, OneHour);

        expect(counter.hasCapacity()).toBe(true);
        expect(counter.hasCapacity()).toBe(true);
        expect(counter.tryRecordEvent()).toBe(true);
    });

    it('Forgets an event exactly one window after it happened, not at a fixed reset time', () => {
        const counter = new SlidingWindowCounter(2, OneHour);
        counter.tryRecordEvent();
        vi.setSystemTime(Date.now() + 30 * OneMinute);
        counter.tryRecordEvent();

        vi.setSystemTime(Date.now() + 30 * OneMinute);
        expect(counter.hasCapacity()).toBe(true);
        expect(counter.tryRecordEvent()).toBe(true);
        expect(counter.tryRecordEvent()).toBe(false);

        vi.setSystemTime(Date.now() + 30 * OneMinute);
        expect(counter.tryRecordEvent()).toBe(true);
    });

    it('Forgets every event once the whole window has passed', () => {
        const counter = new SlidingWindowCounter(3, OneHour);
        counter.tryRecordEvent();
        counter.tryRecordEvent();
        counter.tryRecordEvent();

        vi.setSystemTime(Date.now() + OneHour + 1);

        expect(counter.tryRecordEvent()).toBe(true);
        expect(counter.tryRecordEvent()).toBe(true);
        expect(counter.tryRecordEvent()).toBe(true);
        expect(counter.tryRecordEvent()).toBe(false);
    });

    it('Refuses every event when the limit is zero', () => {
        const counter = new SlidingWindowCounter(0, OneHour);

        expect(counter.hasCapacity()).toBe(false);
        expect(counter.tryRecordEvent()).toBe(false);
    });

    it('Counts the events still allowed, without counting any, and forgets the expired ones', () => {
        const counter = new SlidingWindowCounter(3, OneHour);
        counter.tryRecordEvent();
        counter.tryRecordEvent();

        expect(counter.getRemainingCapacity()).toBe(1);
        expect(counter.getRemainingCapacity()).toBe(1);

        vi.setSystemTime(Date.now() + OneHour + 1);
        expect(counter.getRemainingCapacity()).toBe(3);
    });

    it('Never counts less than zero events still allowed, even with a negative limit', () => {
        const counter = new SlidingWindowCounter(-5, OneHour);

        expect(counter.getRemainingCapacity()).toBe(0);
        expect(counter.hasCapacity()).toBe(false);
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneMinute: number = 60 * 1000;
const OneHour: number = 60 * OneMinute;
