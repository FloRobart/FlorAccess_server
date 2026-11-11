import { describe, it, expect, vi } from "vitest";
import { deleteUnverifiedUsersJob } from "../../../src/core/cron/delete_unverified_users.job";
import { deleteExpiredUnverifiedUsers } from "../../../src/modules/users/users.service";
import logger from "../../../src/core/utils/logger";



vi.mock("../../../src/modules/users/users.service", () => ({
    deleteExpiredUnverifiedUsers: vi.fn(),
    UNVERIFIED_USER_RETENTION_IN_MONTHS: 3,
}));

vi.mock("../../../src/core/utils/logger", () => ({
    default: { info: vi.fn() },
}));



/**
 * Deletion of the unverified users job tests
 */
describe('Deletion of the unverified users job', () => {
    it('Deletes the expired unverified users and logs how many were deleted', async () => {
        vi.mocked(deleteExpiredUnverifiedUsers).mockResolvedValue(4);

        await deleteUnverifiedUsersJob();

        expect(deleteExpiredUnverifiedUsers).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledWith("4 account(s) whose email address was not proven within 3 months deleted");
    });

    it('Gives the error of the deletion to the caller, which logs the failure of the job', async () => {
        const deletionError = new Error("Database unknown error");
        vi.mocked(deleteExpiredUnverifiedUsers).mockRejectedValue(deletionError);

        await expect(deleteUnverifiedUsersJob()).rejects.toBe(deletionError);
        expect(logger.info).not.toHaveBeenCalled();
    });
});
