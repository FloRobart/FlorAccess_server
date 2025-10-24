import { ZodError } from "zod";
import { AuthMethodSchema } from "../../../../src/modules/users/auth-methods/auth_methods.schema";
import { AuthMethod } from "../../../../src/modules/users/auth-methods/auth_methods.types";



/**
 * Auth methods Schemas tests
 */
describe('Auth Schemas module', () => {
    /*========*/
    /* SELECT */
    /*========*/
    /* Auth Methods Schema */
    describe('Auth methods schema', () => {
        it('Correct Auth Methods Select schema', () => {
            for (const data of CorrectAuthMethodSchema) {
                expect(() => AuthMethodSchema.parse(data)).not.toThrow();
                expect(AuthMethodSchema.parse(data)).toStrictEqual(BaseAuthMethodSchema);
            }
        });

        it('Incorrect Auth Methods Select schema', () => {
            for (const data of IncorrectAuthMethodSchema) {
                expect(() => AuthMethodSchema.parse(data)).toThrow(ZodError);
            }
        });
    });
});


/*========*/
/* SELECT */
/*========*/
/* Auth Methods Schema */
const BaseAuthMethodSchema: AuthMethod = {
    id: 1,
    immuable_method_name: "PASSWORD",
    display_name: "Password",

    created_at: new Date(),
    updated_at: new Date()
};

const CorrectAuthMethodSchema: AuthMethod[] = [
    BaseAuthMethodSchema,
    {
        ...BaseAuthMethodSchema,
        immuable_method_name: "  PASSWORD  ",
        display_name: " Password  ",
    }
];

const IncorrectAuthMethodSchema: any[] = [
    {
        ...BaseAuthMethodSchema,
        id: 0, // Should be min 1
    },{
        ...BaseAuthMethodSchema,
        id : -5, // Should be min 1
    },{
        ...BaseAuthMethodSchema,
        id: 1.5, // Should be int
    },{
        ...BaseAuthMethodSchema,
        id: "1", // Should be int
    },{
        ...BaseAuthMethodSchema,
        id: null, // Should be int
    },{
        ...BaseAuthMethodSchema,
        immuable_method_name: "", // Should not be empty
    },{
        ...BaseAuthMethodSchema,
        immuable_method_name: "   ", // Should not be empty
    },{
        ...BaseAuthMethodSchema,
        immuable_method_name: 123, // Should be string
    },{
        ...BaseAuthMethodSchema,
        immuable_method_name: null, // Should be string
    },{
        ...BaseAuthMethodSchema,
        immuable_method_name: undefined, // Should be string
    },{
        ...BaseAuthMethodSchema,
        display_name: "", // Should not be empty
    },{
        ...BaseAuthMethodSchema,
        display_name: "   ", // Should not be empty
    },{
        ...BaseAuthMethodSchema,
        display_name: 123, // Should be string
    },{
        ...BaseAuthMethodSchema,
        display_name: null, // Should be string
    },{
        ...BaseAuthMethodSchema,
        display_name: undefined, // Should be string
    },{
        ...BaseAuthMethodSchema,
        created_at: "not-a-date", // Should be date
    },{
        ...BaseAuthMethodSchema,
        created_at: 123456, // Should be date
    },{
        ...BaseAuthMethodSchema,
        created_at: null, // Should be date
    },{
        ...BaseAuthMethodSchema,
        created_at: undefined, // Should be date
    },{
        ...BaseAuthMethodSchema,
        updated_at: "not-a-date", // Should be date
    },{
        ...BaseAuthMethodSchema,
        updated_at: 123456, // Should be date
    },{
        ...BaseAuthMethodSchema,
        updated_at: null, // Should be not null
    },{
        ...BaseAuthMethodSchema,
        updated_at: undefined, // Should be not null
    },
];