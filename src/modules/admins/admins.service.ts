import type { InsertUser, User, UserSafe } from "../users/users.types";
import type { UserAdmin, UserAdminUpdate } from "./admins.types";

import * as AdminsRepository from "./admins.repository";
import { ZodError } from "zod";
import { AppError } from "../../core/models/AppError.model";
import { UserAdminSchema } from "./admins.schema";
import { insertUser as UsersService_InsertUser } from "../users/users.service";
import { getUser as UsersRepository_SelectUser, _getUserById } from "../users/users.repository";
import { verifyJwt } from "../../core/utils/jwt";



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
export async function selectUsers(): Promise<UserAdmin[]> {
    try {
        const users: User[] = await AdminsRepository.selectUsers();
        return UserAdminSchema.array().parse(users);
    } catch (error) {
        if (error instanceof ZodError) { throw new AppError('Data validation error', 500); }
        if (error instanceof AppError) { throw error; }
        throw new AppError('Unknown error in admin selectUsers', 500);
    }
}


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
