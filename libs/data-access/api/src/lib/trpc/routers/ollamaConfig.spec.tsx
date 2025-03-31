// ollamaConfig.integration.spec.ts

import {ollamaConfigRouter} from "./ollamaConfig.router";
import {database} from "@self-learning/database";
import {getCredentials, getUpdatedCredentials} from "@self-learning/admin";
import {getAvailableModelsOnEndpoint} from "@self-learning/api-client";

// Mock the database module
jest.mock("@self-learning/database", () => ({
	database: {
		ollamaCredentials: {
			create: jest.fn(),
			delete: jest.fn()
		},
		ollamaModels: {
			deleteMany: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn()
		}
	}
}));

// Helper function to create user contexts
function createContext(role: "ADMIN" | "USER") {
	return {
		user: {
			id: `${role.toLowerCase()}-id`,
			name: role.toLowerCase(),
			role,
			isAuthor: false,
			enabledFeatureLearningDiary: false,
			enabledLearningStatistics: true
		}
	};
}

describe("ollamaConfigRouter integration tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("addCredentials", () => {

		describe("getUpdatedCredentials", () => {
			afterEach(() => {
				jest.clearAllMocks();
			});
			it("should add new credentials as admin", async () => {
				const adminCtx = createContext("ADMIN");
				const caller = ollamaConfigRouter.createCaller(adminCtx);

				const input = {
					id: null,
					name: "Test Server",
					token: "test-token",
					endpointUrl: "http://localhost:1234",
					ollamaModels: [
						{
							id: "550e8400-e29b-41d4-a716-446655440000",
							name: "Model A",
							ollamaCredentialsId: "550e8400-e29b-41d4-a716-446655440000"
						}
					]
				};

				(database.ollamaCredentials.create as jest.Mock).mockResolvedValue({
					id: "1",
					name: "Test Server",
					token: "test-token",
					endpointUrl: "http://localhost:1234",
					ollamaModels: undefined
				});

				const result = await caller.addCredentials(input);

				expect(result).toEqual({
					id: "1",
					name: "Test Server",
					token: "test-token",
					endpointUrl: "http://localhost:1234",
					ollamaModels: undefined
				});

				expect(database.ollamaCredentials.create).toHaveBeenCalledWith({
					data: {
						id: undefined,
						name: "Test Server",
						token: "test-token",
						endpointUrl: "http://localhost:1234",
						ollamaModels: undefined
					},
					select: {
						id: true,
						name: true,
						token: true,
						endpointUrl: true,
						ollamaModels: true
					}
				});
			});

			it("should not add new credentials as not admin", async () => {
				const adminCtx = createContext("USER");
				const caller = ollamaConfigRouter.createCaller(adminCtx);

				const input = {
					id: null,
					name: "Test Server",
					token: "test-token",
					endpointUrl: "http://localhost:1234",
					ollamaModels: [
						{
							id: "550e8400-e29b-41d4-a716-446655440000",
							name: "Model A",
							ollamaCredentialsId: "550e8400-e29b-41d4-a716-446655440000"
						}
					]
				};

				const result = await caller.addCredentials(input);

				expect(result).toBeNull();
				expect(database.ollamaCredentials.create).not.toHaveBeenCalled();
			});

			it("should not add new credentials as not admin", async () => {
				const adminCtx = createContext("ADMIN");
				const caller = ollamaConfigRouter.createCaller(adminCtx);

				const input = {
					id: null,
					name: "Test Server",
					token: "test-token",
					endpointUrl: "http://localhost:1234",
					ollamaModels: [
						{
							id: "550e8400-e29b-41d4-a716-446655440000",
							name: "Model A",
							ollamaCredentialsId: "550e8400-e29b-41d4-a716-446655440000"
						}
					]
				};
				const db_mock = (database.ollamaCredentials.create as jest.Mock).mockRejectedValue(
					new Error("DB failure")
				);

				const result = await caller.addCredentials(input);

				expect(result).toBeNull();
				expect(database.ollamaCredentials.create).toHaveBeenCalled();
			});
		});

		describe("addModel", () => {
			it("should add a new model as admin", async () => {
				const adminCtx = createContext("ADMIN");
				const caller = ollamaConfigRouter.createCaller(adminCtx);

				const input = {
					name: "Test Model",
					ollamaCredentialsId: "22222222-2222-2222-2222-222222222222",
					id: null
				};

				(database.ollamaModels.deleteMany as jest.Mock).mockResolvedValue({});
				(database.ollamaModels.create as jest.Mock).mockResolvedValue({
					name: "Test Model",
					id: "33333333-3333-3333-3333-333333333333",
					ollamaCredentialsId: "22222222-2222-2222-2222-222222222222"
				});

				const result = await caller.addModel(input);

				expect(result).toEqual({
					name: "Test Model",
					id: "33333333-3333-3333-3333-333333333333",
					ollamaCredentialsId: "22222222-2222-2222-2222-222222222222"
				});

				expect(database.ollamaModels.deleteMany).toHaveBeenCalled();
				expect(database.ollamaModels.create).toHaveBeenCalledWith({
					data: {
						name: "Test Model",
						ollamaCredentialsId: "22222222-2222-2222-2222-222222222222"
					}
				});
			});

			it("should not add a model if user is not admin", async () => {
				const userCtx = createContext("USER");
				const caller = ollamaConfigRouter.createCaller(userCtx);

				const input = {
					name: "User Attempted Model",
					id: "44444444-4444-4444-4444-444444444444",
					ollamaCredentialsId: "55555555-5555-5555-5555-555555555555"
				};

				const result = await caller.addModel(input);

				expect(result).toBeNull();
				expect(database.ollamaModels.create).not.toHaveBeenCalled();
				expect(database.ollamaModels.deleteMany).not.toHaveBeenCalled();
			});

			it("should not add a model if user is not admin", async () => {
				const userCtx = createContext("USER");
				const caller = ollamaConfigRouter.createCaller(userCtx);

				const input = {
					name: "User Attempted Model",
					id: "44444444-4444-4444-4444-444444444444",
					ollamaCredentialsId: "55555555-5555-5555-5555-555555555555"
				};

				const result = await caller.addModel(input);

				expect(result).toBeNull();
				expect(database.ollamaModels.create).not.toHaveBeenCalled();
				expect(database.ollamaModels.deleteMany).not.toHaveBeenCalled();
			});

			it("should handle error when adding model fails", async () => {
				const adminCtx = createContext("ADMIN");
				const caller = ollamaConfigRouter.createCaller(adminCtx);

				const input = {
					name: "Broken Model",
					id: "66666666-6666-6666-6666-666666666666",
					ollamaCredentialsId: "77777777-7777-7777-7777-777777777777"
				};

				(database.ollamaModels.deleteMany as jest.Mock).mockResolvedValue({});
				(database.ollamaModels.create as jest.Mock).mockRejectedValue(new Error("DB failure"));

				const result = await caller.addModel(input);

				expect(result).toBeNull();
				expect(database.ollamaModels.deleteMany).toHaveBeenCalled();
				expect(database.ollamaModels.create).toHaveBeenCalled();
			});
		});

		describe("removeCredentials", () => {
			it("should remove credentials as admin", async () => {
				const adminCtx = createContext("ADMIN");
				const caller = ollamaConfigRouter.createCaller(adminCtx);

				const input = {
					endpointUrl: "http://localhost:1234"
				};

				(database.ollamaCredentials.delete as jest.Mock).mockResolvedValue({
					id: "1",
					name: "Deleted Server",
					token: "deleted-token",
					endpointUrl: "http://localhost:1234",
					ollamaModels: []
				});

				const result = await caller.removeCredentials(input);

				expect(result).toEqual({
					id: "1",
					name: "Deleted Server",
					token: "deleted-token",
					endpointUrl: "http://localhost:1234",
					ollamaModels: []
				});

				expect(database.ollamaCredentials.delete).toHaveBeenCalledWith({
					where: {endpointUrl: "http://localhost:1234"}
				});
			});
			it("should not remove credentials if user is not admin", async () => {
				const userCtx = createContext("USER");
				const caller = ollamaConfigRouter.createCaller(userCtx);

				const input = {
					endpointUrl: "http://localhost:9999"
				};

				const result = await caller.removeCredentials(input);

				expect(result).toBeNull();
				expect(database.ollamaCredentials.delete).not.toHaveBeenCalled();
			});
			it("should handle error when removing credentials fails", async () => {
				const adminCtx = createContext("ADMIN");
				const caller = ollamaConfigRouter.createCaller(adminCtx);

				const input = {
					endpointUrl: "http://fail.local"
				};

				(database.ollamaCredentials.delete as jest.Mock).mockRejectedValue(
					new Error("DB failure")
				);

				const result = await caller.removeCredentials(input);

				expect(result).toBeNull();
				expect(database.ollamaCredentials.delete).toHaveBeenCalledWith({
					where: {endpointUrl: "http://fail.local"}
				});
			});
		});
	});
});
