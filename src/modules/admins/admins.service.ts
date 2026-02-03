import type { InsertUser, User, UserSafe } from "../users/users.types";
import type { AuthorizedQueryParams, EmailAdmin, UserAdmin, UserAdminUpdate, UserIdList } from "./admins.types";

import * as AdminsRepository from "./admins.repository";
import { ZodError } from "zod";
import { AppError } from "../../core/models/AppError.model";
import { UserAdminSchema } from "./admins.schema";
import { insertUser as UsersService_InsertUser, sendVerificationEmail as UsersService_sendVerificationEmail } from "../users/users.service";
import { getUser as UsersRepository_SelectUser, _getUserById, updateUserEmailVerifyTokenHash } from "../users/users.repository";
import { verifyJwt } from "../../core/utils/jwt";
import { generateApiToken, hashString } from "../../core/utils/securities";
import logger from "../../core/utils/logger";
import AppConfig from "../../config/AppConfig";
import sendEmail from "../../core/email/mailer";
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
        /* Insert user and get JWT */
        const jwt: string = await UsersService_InsertUser(user, null, application, null);
        const decodedUserSafe = verifyJwt(jwt);

        /* Retrieve full user info */
        const selectedUser: User = await UsersRepository_SelectUser(decodedUserSafe);

        /* Set is_connected to false for admin insertion */
        const finalUser: User = await AdminsRepository.updateUser({ is_connected: false }, selectedUser);
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
        console.debug("AdminsService.selectUsers - error:", error);
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
        console.debug("AdminsService.updateUser - currentUser:", currentUser);

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
 * @throws AppError if email sending fails.
 */
export async function sendVerifyEmail(userIdList: number[]): Promise<UserIdList> {
    try {
        const userIdListSuccess: UserIdList = [];
        for (const userId of userIdList) {
            /* Retrieve user info */
            const user: User = await _getUserById(userId);

            /* Generate email verification token */
            const email_verify_token = await generateApiToken();

            /* Update email_verify_token_hash in database */
            await updateUserEmailVerifyTokenHash(userId, await hashString(email_verify_token));

            /* Send verification email */
            await UsersService_sendVerificationEmail(userId, user.email, email_verify_token);

            /* Add userId to success list */
            userIdListSuccess.push(userId);
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
 */
export async function sendEmailAdmin(emailData: EmailAdmin): Promise<UserIdList> {
    try {
        const userIdListSuccess: UserIdList = [];
        for (const userId of emailData.userIdList) {
            /* Retrieve user info */
            const user: User = await _getUserById(userId);

            /* Send email */
            logger.debug(`Sending email to ${user.email} with object "${emailData.object}" and message "${emailData.message}"`);
            if (!AppConfig.app_env.includes('dev')) {
                sendEmail(user.email, emailData.object, await getEmailTemplate("email_from_admin_template", {
                    object: emailData.object,
                    message: emailData.message,
                    currentYear: new Date().getFullYear().toString(),
                }));
            }

            /* Add userId to success list */
            userIdListSuccess.push(userId);
        }

        /* Return list of userIds for whom the email was sent */
        return userIdListSuccess;
    } catch (error) {
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in sendEmailAdmin', 500);
    }
}
