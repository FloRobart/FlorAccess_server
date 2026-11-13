import { describe, it, expect } from "vitest";
import { usersLoginConfirmPassword, usersLoginRequestPassword } from "../../../../../src/modules/users/auth-methods/password/password.service";
import { buildUser } from "../../users.fixtures";



/**
 * Auth methods password module tests
 */
describe('Auth methods password module', () => {
    /* The password method is not implemented yet : it must refuse every login instead of letting it through */
    it('Refuses the login request with a "not implemented" error', async () => {
        await expect(usersLoginRequestPassword(buildUser())).rejects.toMatchObject({ httpStatus: 501 });
    });

    it('Refuses the login confirmation with a "not implemented" error', async () => {
        await expect(usersLoginConfirmPassword()).rejects.toMatchObject({ httpStatus: 501 });
    });
});
