import assert from "node:assert/strict";
import { renderMessage } from "./message.ts";

const { html, text } = renderMessage({ preview: "p", headline: "Hi <b>x</b>", paragraphs: ["a & b"], cta: { label: "Go", href: "https://x.test/?a=1&b=\"2\"" }, details: [["Ref", "KCB-1"]] });
assert.ok(html.includes("Hi &lt;b&gt;x&lt;/b&gt;") && !html.includes("<b>x</b>"), "headline escaped");
assert.ok(html.includes("a &amp; b"), "paragraph escaped");
assert.ok(html.includes('href="https://x.test/?a=1&amp;b=&quot;2&quot;"'), "href escaped");
assert.ok(text.includes("Go: https://x.test/?a=1&b=\"2\"") && text.includes("Ref: KCB-1"), "plain text");
console.log("email ok");
