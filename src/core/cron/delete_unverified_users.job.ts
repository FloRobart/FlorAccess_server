import { deleteExpiredUnverifiedUsers, UNVERIFIED_USER_RETENTION_IN_MONTHS } from '../../modules/users/users.service';
import logger from '../utils/logger';



/**
 * Deletes the accounts whose email address was not proven within UNVERIFIED_USER_RETENTION_IN_MONTHS months after their creation.
 * @throws Error if the accounts cannot be deleted.
 */
export async function deleteUnverifiedUsersJob(): Promise<void> {
    const deletedUserCount: number = await deleteExpiredUnverifiedUsers();

    logger.info(`${deletedUserCount} account(s) whose email address was not proven within ${UNVERIFIED_USER_RETENTION_IN_MONTHS} months deleted`);
}
