import type { User, UserSafe } from "../users/users.types";

import { UserSafeSchema } from "../users/users.schema";
import * as AdminsRepository from "./admins.repository";
import { ZodError } from "zod";
import { AppError } from "../../core/models/AppError.model";
import { UserAdminSchema } from "./admins.schema";
import { UserAdmin } from "./admins.types";



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