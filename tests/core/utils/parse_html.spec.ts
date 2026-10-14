import escapeHtml from "../../../src/core/utils/parse_html";



/**
 * HTML escaping tests
 */
describe('HTML escaping', () => {
    it('Returns a text without special characters unchanged', () => {
        expect(escapeHtml("Econoris 2")).toBe("Econoris 2");
    });

    it('Escapes every HTML special character', () => {
        expect(escapeHtml(`<a href="https://example.com">Tom & 'Jerry'</a>`))
            .toBe("&lt;a href=&quot;https://example.com&quot;&gt;Tom &amp; &#039;Jerry&#039;&lt;/a&gt;");
    });

    it('Escapes the ampersand first, so that the other escapes are not escaped twice', () => {
        expect(escapeHtml("<")).toBe("&lt;");
    });
});
