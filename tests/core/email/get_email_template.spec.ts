import fs from "fs/promises";
import { getEmailTemplate } from "../../../src/core/email/get_email_template";



/* The template is not read from the disk, each test gives its own template */
jest.mock("fs/promises", () => ({
    __esModule: true,
    default: {
        readFile: jest.fn(),
    },
}));

/**
 * Sets the content of the template read by the next call to getEmailTemplate.
 * @param template HTML content of the template
 */
function useTemplate(template: string): void {
    jest.mocked(fs.readFile).mockResolvedValue(template);
}



/**
 * Email template tests
 */
describe('Email template', () => {
    it('Replaces every occurrence of a placeholder, with or without spaces', async () => {
        useTemplate("<h1>{{appName}}</h1><p>{{ appName }}</p>");

        await expect(getEmailTemplate("template", { appName: "Econoris" })).resolves.toBe("<h1>Econoris</h1><p>Econoris</p>");
    });

    it('Escapes the HTML of the variables', async () => {
        useTemplate("<h1>{{appName}}</h1>");

        await expect(getEmailTemplate("template", { appName: `<a href="https://evil.example">Click</a>` }))
            .resolves.toBe("<h1>&lt;a href=&quot;https://evil.example&quot;&gt;Click&lt;/a&gt;</h1>");
    });

    it('Inserts the raw HTML variables without escaping them', async () => {
        useTemplate("<div>{{button}}</div>");

        await expect(getEmailTemplate("template", {}, { button: `<a class="btn">Go</a>` })).resolves.toBe(`<div><a class="btn">Go</a></div>`);
    });

    it('Does not interpret a placeholder written in a value', async () => {
        useTemplate("<h1>{{appName}}</h1><a>{{url}}</a>");

        await expect(getEmailTemplate("template", { appName: "{{url}}", url: "https://example.com" }))
            .resolves.toBe("<h1>{{url}}</h1><a>https://example.com</a>");
    });

    it('Does not interpret a replacement pattern written in a value', async () => {
        useTemplate("<h1>{{appName}}</h1>");

        await expect(getEmailTemplate("template", { appName: "$& $1 $$" })).resolves.toBe("<h1>$&amp; $1 $$</h1>");
    });

    it('Leaves the placeholder when the variable is missing or is not a text', async () => {
        useTemplate("<h1>{{appName}}</h1><p>{{message}}</p>");
        const variablesWithArray = { appName: ["a", "b"] } as unknown as Record<string, string>;

        await expect(getEmailTemplate("template", variablesWithArray)).resolves.toBe("<h1>{{appName}}</h1><p>{{message}}</p>");
    });
});
