import { removeInvalidLanguage } from "./invalid-language-filter";
import { Element, Parent } from "hast";

describe("removeInvalidLanguage", () => {
	it("should return early if parent is not a Parent node or Element node", () => {
		const node = {
			type: "element",
			tagName: "code",
			properties: { className: ["language-javascript"] }
		} as unknown as Element;
		const parent = { type: "text", children: [node] } as Parent;

		removeInvalidLanguage(node, 0, parent);

		expect(node.properties?.className).toEqual(["language-javascript"]);
	});

	it("should return early if node is not a code element", () => {
		const node = {
			type: "element",
			tagName: "div",
			properties: { className: ["language-javascript"] }
		} as unknown as Element;
		const parent = { type: "element", children: [node] } as Parent;

		removeInvalidLanguage(node, 0, parent);

		expect(node.properties?.className).toEqual(["language-javascript"]);
	});

	it("should remove language from className if language is not registered in refractor", () => {
		const node = {
			type: "element",
			tagName: "code",
			properties: { className: ["language-unknown"] }
		} as unknown as Element;
		const parent = { type: "element", children: [node] } as Parent;

		removeInvalidLanguage(node, 0, parent);

		expect(node.properties?.className).toEqual([]);
	});

	it("should not remove language from className if language is registered in refractor", () => {
		const node = {
			type: "element",
			tagName: "code",
			properties: { className: ["language-javascript"] }
		} as unknown as Element;
		const parent = { type: "element", children: [node] } as Parent;

		removeInvalidLanguage(node, 0, parent);

		expect(node.properties?.className).toEqual(["language-javascript"]);
	});
});
