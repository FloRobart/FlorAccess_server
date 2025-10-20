import { AppError } from "../../../../core/models/ErrorModel";
import { User } from "../../users.types";



export async function usersLoginRequestPassword(user: User): Promise<string> {
    throw new AppError({ message: "Password authentication method not implemented yet", httpStatus: 501 });
}