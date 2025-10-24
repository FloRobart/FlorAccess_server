import { ZodError } from "zod";
import { AuthorizationHeaderSchema, IPAddressSchema, UserInsertSchema, UserLoginConfirmSchema, UserLoginRequestSchema, UserSafeSchema, UserSchema, UserUpdateSchema, UserEmailVerificationSchema } from "../../../src/modules/users/users.schema";
import { AuthorizationHeader, InsertUser, IPAddress, UpdateUser, User, UserLoginConfirm, UserSafe, UserEmailVerification } from "../../../src/modules/users/users.types";



/**
 * Users Schemas tests
 */
describe('Users Schemas tests', () => {
    /*========*/
    /* INSERT */
    /*========*/
    /* User Insert Schema */
    describe('User Insert schema', () => {
        it('Correct User Insert schema', () => {
            for (const data of CorrectUserInsertSchema) {
                expect(() => UserInsertSchema.parse(data)).not.toThrow();
                expect(UserInsertSchema.parse(data)).toStrictEqual(BaseUserInsertSchema);
            }

            expect(UserInsertSchema.parse({
                email: " test 1@test.fr ",
                pseudo: " test1@test.fr ",
            })).toStrictEqual({
                email: "test1@test.fr",
                pseudo: "test1@test.fr",
            });
        });

        it('Incorrect User Insert schema', () => {
            for (const data of IncorrectUserInsertSchema) {
                expect(() => UserInsertSchema.parse(data)).toThrow(ZodError);
            }
        });
    });

    /*========*/
    /* SELECT */
    /*========*/
    /* UserSafe Schema */
    describe('User Safe schema', () => {
        it('Correct UserSafe schema', () => {
            for (const data of CorrectUserSafeSchema) {
                expect(UserSafeSchema.parse(data)).toStrictEqual(BaseUserSafeSchema);
                expect(() => UserSafeSchema.parse(data)).not.toThrow();
            }
        });

        it('Incorrect UserSafe schema', () => {
            for (const data of IncorrectUserSafeSchema) {
                expect(() => UserSafeSchema.parse(data)).toThrow(ZodError);
            }
        });
    });

    /* User Schema */
    describe('User schema', () => {
        it('Correct User schema', () => {
            for (const data of CorrectUserSchema) {
                expect(() => UserSchema.parse(data)).not.toThrow();
            }
            expect(UserSchema.parse(BaseUserSchema)).toStrictEqual(BaseUserSchema);
        });

        it('Incorrect User schema', () => {
            for (const data of IncorrectUserSchema) {
                expect(() => UserSchema.parse(data)).toThrow(ZodError);
            }
        });
    });

    /* IP Address Schema */
    describe('IP Address schemas', () => {
        it('Correct IP Address schema', () => {
            for (const data of CorrectIPAddressSchema) {
                expect(() => IPAddressSchema.parse(data)).not.toThrow();
            }
        });

        it('Incorrect IP Address schema', () => {
            for (const data of IncorrectIPAddressSchema) {
                expect(() => IPAddressSchema.parse(data)).toThrow(ZodError);
            }
        });
    });

    /* Authorization Header Schema */
    describe('Authorization Header schema', () => {
        it('Correct Authorization Header schema', () => {
            for (const data of CorrectAuthorizationHeaderSchema) {
                expect(() => AuthorizationHeaderSchema.parse(data)).not.toThrow();
                expect(AuthorizationHeaderSchema.parse(data)).toStrictEqual(CorrectAuthorizationHeaderSchema[0]);
            }
        });

        it('Incorrect Authorization Header schema', () => {
            for (const data of IncorrectAuthorizationHeaderSchema) {
                expect(() => AuthorizationHeaderSchema.parse(data)).toThrow(ZodError);
            }
        });
    });


    /*========*/
    /* UPDATE */
    /*========*/
    describe('User Update schema', () => {
        it('Correct User Update schema', () => {
            for (const data of CorrectUserUpdateSchema) {
                expect(() => UserUpdateSchema.parse(data)).not.toThrow();
                expect(UserUpdateSchema.parse(data)).toStrictEqual(BaseUserUpdateSchema);
            }

            expect(UserUpdateSchema.parse({
                email: " test 1@test.fr ",
                pseudo: " test1@test.fr ",
            })).toStrictEqual({
                email: "test1@test.fr",
                pseudo: "test1@test.fr",
            });
        });

        it('Incorrect User Update schema', () => {
            for (const data of IncorrectUserUpdateSchema) {
                expect(() => UserUpdateSchema.parse(data)).toThrow(ZodError);
            }
        });
    });


    /*=======*/
    /* LOGIN */
    /*=======*/
    /* User Login Request */
    describe('User Login Request schema', () => {
        it('Correct User Login Request schema', () => {
            for (const data of CorrectUserLoginRequestSchema) {
                expect(() => UserLoginRequestSchema.parse(data)).not.toThrow();
                expect(UserLoginRequestSchema.parse(data)).toStrictEqual(CorrectUserLoginRequestSchema[0]);
            }
        });

        it('Incorrect User Login Request schema', () => {
            for (const data of IncorrectUserLoginRequestSchema) {
                expect(() => UserLoginRequestSchema.parse(data)).toThrow(ZodError);
            }
        });
    });

    /* User Login Confirm */
    describe('User Login Confirm schema', () => {
        it('Correct User Login Confirm schema', () => {
            for (const data of CorrectUserLoginConfirmSchema) {
                expect(() => UserLoginConfirmSchema.parse(data)).not.toThrow();
                expect(UserLoginConfirmSchema.parse(data)).toStrictEqual(CorrectUserLoginConfirmSchema[0]);
            }
        });

        it('Incorrect User Login Confirm schema', () => {
            for (const data of IncorrectUserLoginConfirmSchema) {
                expect(() => UserLoginConfirmSchema.parse(data)).toThrow(ZodError);
            }
        });
    });


    /*====================*/
    /* Email verification */
    /*====================*/
    describe('User Email Verification schema', () => {
        it('Correct User Email Verification schema', () => {
            for (const data of CorrectUserEmailVerificationSchema) {
                expect(() => UserEmailVerificationSchema.parse(data)).not.toThrow();
                expect(UserEmailVerificationSchema.parse(data)).toStrictEqual(CorrectUserEmailVerificationSchema[0]);
            }
        });

        it('Incorrect User Email Verification schema', () => {
            for (const data of IncorrectUserEmailVerificationSchema) {
                expect(() => UserEmailVerificationSchema.parse(data)).toThrow(ZodError);
            }
        });
    });
});


/*========*/
/* INSERT */
/*========*/
/* User Insert Schema */
const BaseUserInsertSchema: InsertUser = {
    email: "test1@test.fr",
    pseudo: "Pseudo",
};

const CorrectUserInsertSchema: any[] = [
    BaseUserInsertSchema,
    {
        email: BaseUserInsertSchema.email,
        pseudo: "   Pseudo   ",
    },{
        email: "    tes  t1@ test . f  r",
        pseudo: "   Pseudo   ",
    },{
        email: "    tes  t 1@ test . f  r",
        pseudo: "   Pseudo   ",
        test: "This field should be ignored",
    },
];

const IncorrectUserInsertSchema: any[] = [
    {
        email: "invalid-email", // should be valid email
        pseudo: "Pseudo",
    },{
        email: "test@test.fr",
        pseudo: "Ps", // should be >= 3 characters
    },{
        email: "test@test.fr",
        pseudo: "P".repeat(300), // should be <= 255 characters
    },{
        email: 12345, // should be string
        pseudo: "Pseudo"
    },{
        email: "test@test.fr",
        // Missing pseudo
    },{
        // Missing email
        pseudo: "test@test.fr",
    },{
        email: "test@test.fr",
        randomKey: "test@test.fr", // unexpected key
    },{
        randomKey: "test@test.fr", // unexpected key
        pseudo: "test@test.fr",
    },{
        // Empty object
    },{
        email: null, // should be string
        pseudo: "Pseudo",
    },{
        email: "test@test.fr",
        pseudo: null, // should be string
    },{
        email: "test@test.fr",
        pseudo: 123456, // should be string
    },{
        email: "test@test.fr",
        pseudo: true, // should be string
    },{
        email: true, // should be string
        pseudo: "Pseudo",
    },{
        email: [], // should be string
        pseudo: "Pseudo",
    },{
        email: "test@test.fr",
        pseudo: {}, // should be string
    },{
        email: undefined, // should be string
        pseudo: "Pseudo",
    },{
        email: "test@test.fr",
        pseudo: undefined, // should be string
    },
];


/*========*/
/* SELECT */
/*========*/
/* UserSafe Schema */
const BaseUserSafeSchema: UserSafe = {
    id: 1,
    email: "test1@test.fr",
    pseudo: "Pseudo",

    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: true,
    last_login: new Date(),

    created_at: new Date(),
    updated_at: new Date(),
};

const CorrectUserSafeSchema: UserSafe[] = [
    BaseUserSafeSchema,
];

const IncorrectUserSafeSchema: any[] = [
    {
        ...BaseUserSafeSchema,
        id: "1", // should be integer
    },{
        ...BaseUserSafeSchema,
        id: -5, // should be positive
    },{
        ...BaseUserSafeSchema,
        id: 1.5, // should be integer
    },{
        ...BaseUserSafeSchema,
        id: 0, // should be >= 1
    },{
        ...BaseUserSafeSchema,
        id: null, // should be number
    },{
        ...BaseUserSafeSchema,
        id: undefined, // should be number
    },{
        ...BaseUserSafeSchema,
        email: "invalid-email", // should be valid email
    },{
        ...BaseUserSafeSchema,
        pseudo: "Ps", // should be >= 3 characters
    },{
        ...BaseUserSafeSchema,
        auth_methods_id: "1", // should be integer
    },{
        ...BaseUserSafeSchema,
        auth_methods_id: -3, // should be positive
    },{
        ...BaseUserSafeSchema,
        auth_methods_id: 2.7, // should be integer
    },{
        ...BaseUserSafeSchema,
        auth_methods_id: 0, // should be >= 1
    },{
        ...BaseUserSafeSchema,
        auth_methods_id: null, // should be number
    },{
        ...BaseUserSafeSchema,
        auth_methods_id: undefined, // should be number
    },{
        ...BaseUserSafeSchema,
        is_connected: "true", // should be boolean
    },{
        ...BaseUserSafeSchema,
        is_connected: 0, // should be boolean
    },{
        ...BaseUserSafeSchema,
        is_verified_email: "false", // should be boolean
    },{
        ...BaseUserSafeSchema,
        is_verified_email: 0, // should be boolean
    },{
        ...BaseUserSafeSchema,
        last_login: "not-a-date", // should be date
    },{
        ...BaseUserSafeSchema,
        last_login: 123456789, // should be date
    },{
        ...BaseUserSafeSchema,
        created_at: "not-a-date", // should be date
    },{
        ...BaseUserSafeSchema,
        created_at: 123456789, // should be date
    },{
        ...BaseUserSafeSchema,
        updated_at: "not-a-date", // should be date
    },{
        ...BaseUserSafeSchema,
        updated_at: 123456789, // should be date
    },
]

/* User Schema */
const BaseUserSchema: User = {
    ...BaseUserSafeSchema,
    last_ip: "192.168.1.1",
    email_verify_token_hash: "hashed_token",
    secret_hash: "hashed_secret",
    token_hash: "hashed_token",
};

const CorrectUserSchema: User[] = [
    BaseUserSchema,
    {
        ...BaseUserSchema,
        last_ip: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        email_verify_token_hash: "email_verify_token ",
        secret_hash: " another_hashed_secret ",
        token_hash: " another_hashed_token ",
    },{
        ...BaseUserSchema,
        last_ip: "::1",
        email_verify_token_hash: null,
        secret_hash: null,
        token_hash: null,
    },{
        ...BaseUserSchema,
        last_ip: null,
        email_verify_token_hash: null,
        secret_hash: null,
        token_hash: null,
    }
];

const IncorrectUserSchema: any[] = [
    {
        ...BaseUserSafeSchema,
        last_ip: "999.999.999.999", // invalid IP
    },{
        ...BaseUserSafeSchema,
        last_ip: "invalid-ip", // invalid IP
    },{
        ...BaseUserSafeSchema,
        email_verify_hash: 123456, // should be string or null
    },{
        ...BaseUserSafeSchema,
        secret_hash: 123456, // should be string or null
    },{
        ...BaseUserSafeSchema,
        token_hash: 123456, // should be string or null
    },
];

/* IP Address Schema */
const CorrectIPAddressSchema: IPAddress[] = [
    "192.168.1.1",
    "::1",
    "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    "0.0.0.0",
];

const IncorrectIPAddressSchema: any[] = [
    "192.168.1.1.1", // invalid IPv4
    "192.168", // incomplete IPv4
    " 192.168.1.1 ", // leading/trailing spaces
    "192. 168 .1.1", // spaces inside
    "999.999.999.999", // invalid IPv4
    "::1.1", // invalid IPv6
    "gggg:hhhh:iiii:jjjj:kkkk:llll:mmmm:nnnn", // invalid IPv6
    "invalid-ip", // not an IP
    123456, // should be string
    null, // should be string
    undefined, // should be string
    192.168, // should be string
];

/* Authorization Header Schema */
const CorrectAuthorizationHeaderSchema: AuthorizationHeader[] = [
    "Bearer abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz",
    " Bearer abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz ",
    "   Bearer abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz",
    "Bearer abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz   ",
];

const IncorrectAuthorizationHeaderSchema: any[] = [
    "Bearer", // missing token
    "Bearer ", // missing token
    "Bearer abcdefghijklmnopqrstuvwxyz", // incomplete token
    " abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz", // missing 'Bearer'
    "Bearerabcdefg hijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz", // space in token
    "Bearer  abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz", // double space after 'Bearer'
    "Token abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz", // wrong prefix
    "", // empty string
    "   ", // spaces only
    123456, // should be string
    null, // should be string
    undefined, // should be string
];


/*========*/
/* UPDATE */
/*========*/
/* User Update Schema */
const BaseUserUpdateSchema: UpdateUser = BaseUserInsertSchema;
const CorrectUserUpdateSchema: any[] = CorrectUserInsertSchema;
const IncorrectUserUpdateSchema: any[] = IncorrectUserInsertSchema;


/*=======*/
/* LOGIN */
/*=======*/
/* User Login Request */
const CorrectUserLoginRequestSchema: any[] = [
    {
        email: "test1@test.fr",
    },{
        email: " test1@test.fr ",
    },{
        email: "    tes  t 1@ test . f  r",
    },{
        email: "test1@test.fr",
        test: "This field should be ignored",
    },
];

const IncorrectUserLoginRequestSchema: any[] = [
    {
        email: "invalid-email", // should be valid email
    },{
        email: 12345, // should be string
    },{
        // Missing email
    },{
        email: null, // should be string
    },{
        email: undefined, // should be string
    },{
        email: true, // should be string
    },{
        email: [], // should be string
    },
];

/* User Login Confirm */
const CorrectUserLoginConfirmSchema: UserLoginConfirm[] = [
    {
        email: "test1@test.fr",
        token: "123456",
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: " test1@test.fr",
        token: " 123456 ",
        secret: " abcdef ",
        ip: "192.168.1.1",
    },
];

const IncorrectUserLoginConfirmSchema: any[] = [
    {
        email: "invalid-email", // should be valid email
        token: "123456",
        secret: "abcdef",
        ip: null,
    },{
        email: "test1@test.fr",
        token: "123456",
        secret: "abcdef",
        ip: "   192.168.1.1", // should not have leading/trailing spaces
    },{
        // Missing email
        token: "123456",
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        // Missing token
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: "123456",
        // Missing secret
        ip: "192.168.1.1",
    },{
        // Missing email
        token: "123456",
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: "", // should be at least 1 character
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: "123456",
        secret: "", // should be at least 1 character
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: null, // should be not be null
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: "123456",
        secret: null, // should be not be null
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: undefined, // should be not be undefined
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: "123456",
        secret: undefined, // should be not be undefined
        ip: "192.168.1.1",
    },{
        email: "", // should be at least 1 character
        token: "123456",
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: null, // should be at least 1 character
        token: "123456",
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: 123456, // should be a string
        secret: "abcdef",
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: "123456",
        secret: 123456, // should be a string
        ip: "192.168.1.1",
    },{
        email: "test1@test.fr",
        token: "123456",
        secret: "abcdef",
        ip: 192.168, // should be a string
    },
];


/*====================*/
/* Email verification */
/*====================*/
const CorrectUserEmailVerificationSchema: UserEmailVerification[] = [
    {
        userId: "1",
        token: "abcdef",
    },{
        userId: "  1  ",
        token: "  abcdef  ",
    },
];

const IncorrectUserEmailVerificationSchema: any[] = [
    {
        userId: "0", // should be positive integer
        token: "abcdef",
    },{
        userId: "-1", // should be positive integer
        token: "abcdef",
    },{
        userId: "1.5", // should be integer
        token: "abcdef",
    },{
        userId: "", // should be at least 1 character
        token: "abcdef",
    },{
        userId: "1",
        token: "", // should be at least 1 character
    },{
        // Missing userId
        token: "abcdef",
    },{
        userId: "1",
        // Missing token
    },{
        userId: null, // should be string
        token: "abcdef",
    },{
        userId: "1",
        token: null, // should be string
    },{
        userId: undefined, // should be string
        token: "abcdef",
    },{
        userId: "1",
        token: undefined, // should be string
    },{
        userId: 12345, // should be string
        token: "abcdef",
    },{
        userId: "1",
        token: 12345, // should be string
    },
];