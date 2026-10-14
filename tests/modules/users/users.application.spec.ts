import { ZodError } from "zod";
import { UserApplicationSchema } from "../../../src/modules/users/users.schema";



/**
 * User Application schema tests
 */
describe('User Application schema', () => {
    it('Correct User Application schema', () => {
        for (const data of CorrectUserApplicationSchema) {
            expect(() => UserApplicationSchema.parse(data)).not.toThrow();
        }

        expect(UserApplicationSchema.parse({
            application: "  Econoris  ",
            domain: " example.com ",
            test: "This field should be ignored",
        })).toStrictEqual({
            application: "Econoris",
            domain: "example.com",
        });
    });

    it('Incorrect User Application schema', () => {
        for (const data of IncorrectUserApplicationSchema) {
            expect(() => UserApplicationSchema.parse(data)).toThrow(ZodError);
        }
    });
});


/*===========*/
/* Test data */
/*===========*/
const CorrectUserApplicationSchema: any[] = [
    {
        // Both fields are optional
    },{
        application: "Econoris",
    },{
        application: "Mon appli_2.0 - bêta",
        domain: "example.com",
    },{
        domain: "localhost:26003",
    },
];

const IncorrectUserApplicationSchema: any[] = [
    {
        application: "<b>Econoris</b>", // should not contain HTML
    },{
        application: "Go to https://evil.example", // should not contain a link
    },{
        application: "A".repeat(51), // should be <= 50 characters
    },{
        application: "", // should be at least 1 character
    },{
        application: ["Econoris", "Other"], // should be string (query parameter sent twice)
    },{
        application: 12345, // should be string
    },{
        domain: ["example.com", "other.example"], // should be string (query parameter sent twice)
    },{
        domain: "", // should be at least 1 character
    },{
        domain: "a".repeat(256), // should be <= 255 characters
    },
];
