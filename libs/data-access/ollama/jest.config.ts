/* eslint-disable */
export default {
	displayName: "data-access-ollama",
	preset: "../../../jest.preset.js",
	testEnvironment: "node",
	transform: {
		"^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }]
	},
	moduleFileExtensions: ["ts", "js", "html"],
	coverageDirectory: "../../../coverage/libs/data-access/ollama"
};
