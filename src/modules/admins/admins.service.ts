import type { InsertUser, User, UserSafe } from "../users/users.types";
import type { AuthorizedQueryParams, EmailAdmin, UserAdmin, UserAdminUpdate, UserIdList } from "./admins.types";

import * as AdminsRepository from "./admins.repository";
import { ZodError } from "zod";
import { AppError } from "../../core/models/AppError.model";
import { UserAdminSchema } from "./admins.schema";
import { createUserAndSendVerificationEmail as UsersService_CreateUser, sendVerificationEmail as UsersService_sendVerificationEmail } from "../users/users.service";
import { _getUserById, updateUserEmailVerifyTokenHash } from "../users/users.repository";
import { generateApiToken, hashToken } from "../../core/utils/securities";
import logger from "../../core/utils/logger";
import AppConfig from "../../config/AppConfig";
import sendEmail, { assertAdminEmailsCanBeSent, assertEmailCanBeSent } from "../../core/email/mailer";
import { getEmailTemplate } from "../../core/email/get_email_template";



/**
 * Vérifie si l'utilisateur est un administrateur.
 * @param userSafe L'objet UserSafe de l'utilisateur à vérifier.
 * @returns True si l'utilisateur est un administrateur, false sinon.
 * @throws Error si la vérification échoue.
 */
export async function isAdmin(userSafe: UserSafe): Promise<boolean> {
    try {
        return AdminsRepository.isAdmin(userSafe);
    } catch (error) {
        throw error;
    }
}


/*========*/
/* INSERT */
/*========*/
/**
 * Inserts a new user.
 * @param user The InsertUser object containing the user's information.
 * @param application The name of the application where the user is being registered.
 * @returns The newly created UserAdmin object.
 * @throws AppError if user creation or data validation fails.
 */
export async function insertUser(user: InsertUser, application: string): Promise<UserAdmin> {
    try {
        /* The new user receives a verification email: nothing is created if it can not be sent */
        assertAdminEmailsCanBeSent(1);

        /* Insert user */
        const insertedUser: User | null = await UsersService_CreateUser(user, null, application, null);
        if (insertedUser === null) { throw new AppError('A user with this email already exists', 409); }

        /* Set is_connected to false for admin insertion */
        const finalUser: User = await AdminsRepository.updateUser({ is_connected: false }, insertedUser);
        const finalUserAdmin: UserAdmin = UserAdminSchema.parse(finalUser);

        /* Return final user admin */
        return finalUserAdmin;
    } catch (error) {
        if (error instanceof ZodError) { throw new AppError('Data validation error', 500); }
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in admin insertUser', 500);
    }
}


/*========*/
/* SELECT */
/*========*/
/**
 * Retrieves no sensitive information about all users.
 * @returns List of UserAdmin objects.
 * @throws AppError if user retrieval or data validation fails.
 */
export async function selectUsers(queryParams: AuthorizedQueryParams): Promise<UserAdmin[]> {
    try {
        const users: User[] = await AdminsRepository.selectUsers(queryParams);
        return UserAdminSchema.array().parse(users);
    } catch (error) {
        if (error instanceof ZodError) { throw new AppError('Data validation error', 500); }
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in admin selectUsers', 500);
    }
}

/**
 * Counts the total number of users.
 * @returns Total number of users or error response
 */
export async function countUsers(): Promise<number> {
    try {
        return await AdminsRepository.countUsers();
    } catch (error) {
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in admin countUsers', 500);
    }
};


/*========*/
/* UPDATE */
/*========*/
export async function updateUser(userId: number, updateUserData: UserAdminUpdate): Promise<UserAdmin> {
    try {
        /* Retrieve current user data */
        const currentUser: User = await _getUserById(userId);

        /* Update user data */
        const updatedUser: User = await AdminsRepository.updateUser(updateUserData, currentUser);
        const updatedUserAdmin: UserAdmin = UserAdminSchema.parse(updatedUser);

        /* Return updated user admin */
        return updatedUserAdmin;
    } catch (error) {
        if (error instanceof ZodError) { throw new AppError('Data validation error', 500); }
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in admin updateUser', 500);
    }
}


/**
 * Unblocks the logins of a user, blocked by his block link or after too many login codes sent without a successful login.
 * @param userId The ID of the user to unblock.
 * @returns The unblocked UserAdmin object.
 * @throws AppError 404 if no user has this ID, 500 if the stored user is not valid.
 */
export async function unblockUserLogin(userId: number): Promise<UserAdmin> {
    try {
        const unblockedUser: User = await AdminsRepository.unblockUserLogin(userId);
        logger.info(`Logins of user-${userId} unblocked by an administrator`);

        return UserAdminSchema.parse(unblockedUser);
    } catch (error) {
        if (error instanceof ZodError) { throw new AppError('Data validation error', 500); }
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in admin unblockUserLogin', 500);
    }
}


/*========*/
/* DELETE */
/*========*/
/**
 * Deletes a user.
 * @param userId The ID of the user to delete
 */
export async function deleteUser(userId: number): Promise<void> {
    try {
        await AdminsRepository.deleteUser(userId);
    } catch (error) {
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in admin deleteUser', 500);
    }
}


/*=======*/
/* Email */
/*=======*/
/**
 * Sends verification emails to a list of users.
 * @param userIdList The list of user IDs to send verification emails to.
 * @returns List of user IDs for whom the email was sent.
 * @throws AppError 404 if an ID belongs to no user, 503 if the emails left today are not enough, or if email sending fails.
 */
export async function sendVerifyEmail(userIdList: number[]): Promise<UserIdList> {
    try {
        /* Checked for the whole list before the first email: the sending reaches every user or none of them */
        const users: User[] = await getUsersById(userIdList);
        assertAdminEmailsCanBeSent(users.length);

        const userIdListSuccess: UserIdList = [];
        for (const user of users) {
            /* The current link of the user must stay valid if the new one can not be sent */
            assertEmailCanBeSent();

            /* Generate email verification token */
            const email_verify_token = await generateApiToken();

            /* Update email_verify_token_hash in database */
            await updateUserEmailVerifyTokenHash(user.id, hashToken(email_verify_token));

            /* Send verification email */
            await UsersService_sendVerificationEmail(user.id, user.email, email_verify_token);

            /* Add userId to success list */
            userIdListSuccess.push(user.id);
        }

        /* Return list of userIds for whom the email was sent */
        return userIdListSuccess;
    } catch (error) {
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in admin sendVerifyEmail', 500);
    }
}

/**
 * Sends emails to a list of users.
 * @param emailData The email data containing userIdList, object, and message.
 * @returns List of user IDs for whom the email was sent.
 * @throws AppError 404 if an ID belongs to no user, 503 if the emails left today are not enough, or if email sending fails.
 */
export async function sendEmailAdmin(emailData: EmailAdmin): Promise<UserIdList> {
    try {
        /* Checked for the whole list before the first email: the sending reaches every user or none of them */
        const users: User[] = await getUsersById(emailData.userIdList);
        assertAdminEmailsCanBeSent(users.length);

        const userIdListSuccess: UserIdList = [];
        for (const user of users) {
            /* Send email */
            logger.debug(`Sending email to ${user.email} with object "${emailData.object}" and message "${emailData.message}"`);
            if (!AppConfig.app_env.includes('dev')) {
                await sendEmail(user.email, emailData.object, await getEmailTemplate("email_from_admin_template", {
                    object: emailData.object,
                    message: emailData.message,
                    currentYear: new Date().getFullYear().toString(),
                }));
            }

            /* Add userId to success list */
            userIdListSuccess.push(user.id);
        }

        /* Return list of userIds for whom the email was sent */
        return userIdListSuccess;
    } catch (error) {
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in sendEmailAdmin', 500);
    }
}


/**
 * Reads the users targeted by a sending of the administrators.
 * @param userIdList The IDs of the users.
 * @returns The users, in the order of their IDs.
 * @throws AppError 404 if an ID belongs to no user.
 */
async function getUsersById(userIdList: number[]): Promise<User[]> {
    return await Promise.all(userIdList.map((userId: number) => _getUserById(userId)));
}
