// edit-ollamaConfig.spec.tsx
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	ControlledOllamaCredentialsFormDialog,
	CredentialsContext,
	CredentialsContextType,
	getCredentials,
	OllamaCredentialsFormDialog,
	OllamaCredToggle,
	OllamaModelForm,
	useCredentialsContext
} from "./edit-ollamaConfig";
import { TextDecoder, TextEncoder } from "util";
import { useState } from "react";
import { database } from "@self-learning/database";

Object.assign(global, { TextDecoder, TextEncoder });

// Create a mocked mutation function
const addModelMock = jest.fn();
const addCredentialMock = jest.fn();
const removeCredentialMock = jest.fn();

const getModelsMock = jest.fn();

jest.mock("@self-learning/api-client", () => ({
	trpc: {
		ollamaConfig: {
			addModel: {
				useMutation: () => ({
					mutateAsync: addModelMock
				})
			},
			addCredentials: {
				useMutation: () => ({
					mutateAsync: addCredentialMock
				})
			},
			removeCredentials: {
				useMutation: () => ({
					mutateAsync: removeCredentialMock
				})
			}
		},
		ollama: {
			models: {
				useMutation: () => ({
					mutateAsync: getModelsMock
				})
			}
		}
	}
}));

jest.mock("@self-learning/database", () => ({
	database: {
		ollamaCredentials: {
			findMany: jest.fn(),
		},
	},
}));

function TestWrapper({testCredentials, children}: { testCredentials: OllamaCredToggle[], children: any }) {
	const [credentials, setCredentials] = useState<OllamaCredToggle[]>(testCredentials);
	return (
		<CredentialsContext.Provider value={{credentials, setCredentials}}>
			{children}
		</CredentialsContext.Provider>
	);
}

describe("ai-configuration Components", () => {
	describe("OllamaCredentialsForm", () => {
		beforeEach(() => {
			addCredentialMock.mockClear();
		});

		it("calls setCredentials when a new credential is submitted", async () => {
			const mockSetCredentials = jest.fn();

			const mockCred: OllamaCredToggle = {
				id: "123",
				name: "Test Server",
				token: "abc123",
				endpointUrl: "http://localhost:11434",
				available: true,
				ollamaModels: [
					{
						id: "",
						name: "llama2",
						toggle: true,
						ollamaCredentialsId: "123"
					}
				]
			};

			const fakeOnSubmit = jest.fn().mockResolvedValue(mockCred);

			render(
				<CredentialsContext.Provider
					value={{ credentials: [], setCredentials: mockSetCredentials }}
				>
					<ControlledOllamaCredentialsFormDialog onSubmit={fakeOnSubmit} />
				</CredentialsContext.Provider>
			);

			await userEvent.click(screen.getByTestId("ServerAddButton"));

			await userEvent.type(screen.getByTestId("CredentialName"), mockCred.name);
			await userEvent.type(screen.getByTestId("CredentialToken"), mockCred.token);
			await userEvent.type(screen.getByTestId("CredentialUrl"), mockCred.endpointUrl);

			fireEvent.submit(screen.getByTestId("OllamaCredentialsForm"));

			await waitFor(() => {
				expect(fakeOnSubmit).toHaveBeenCalledTimes(1);
				expect(mockSetCredentials).toHaveBeenCalledTimes(1);

				expect(mockSetCredentials).toHaveBeenCalledWith(
					expect.arrayContaining([
						{
							endpointUrl: "http://localhost:11434",
							name: "Test Server",
							token: "abc123"
						}
					])
				);
			});
		});

		it("should call addCredentials when add button ist clicked", async () => {
			const dummyCredentials: OllamaCredToggle[] = [
				{
					id: "",
					name: "TestModel1",
					token: "234234334",
					endpointUrl: "http://test.de",
					available: true,
					ollamaModels: [
						{
							id: "",
							name: "",
							toggle: false,
							ollamaCredentialsId: ""
						}
					]
				}
			];
			const expectedCredentials = {
				id: null,
				ollamaModels: [],
				name: "TestModel1",
				token: "234234334",
				endpointUrl: "http://test.de"
			};

			// Act
			render(
				<TestWrapper testCredentials={dummyCredentials}>
					<OllamaCredentialsFormDialog />
				</TestWrapper>
			);

			const serverAddButton = screen.getByTestId("ServerAddButton");

			await userEvent.click(serverAddButton);
			await userEvent.click(serverAddButton);
			await userEvent.click(serverAddButton);

			const form = screen.getByTestId("OllamaCredentialsForm");

			const credentialNameInput = screen.getByTestId("CredentialName");
			const credentialTokenInput = screen.getByTestId("CredentialToken");
			const credentialEndpointUrlInput = screen.getByTestId("CredentialUrl");

			await userEvent.type(credentialNameInput, dummyCredentials[0].name);
			await userEvent.type(credentialTokenInput, dummyCredentials[0].token);
			await userEvent.type(credentialEndpointUrlInput, dummyCredentials[0].endpointUrl);

			fireEvent.submit(form);

			// Assert
			await waitFor(() => {
				expect(addCredentialMock).toHaveBeenCalledTimes(1);
				expect(addCredentialMock).toHaveBeenCalledWith(expectedCredentials);
			});
		});

		it("should call crete error toast if url is added again", async () => {
			const dummyCredentials: OllamaCredToggle[] = [
				{
					id: "",
					name: "TestModel1",
					token: "234234334",
					endpointUrl: "http://test.de",
					available: true,
					ollamaModels: [
						{
							id: "",
							name: "",
							toggle: false,
							ollamaCredentialsId: ""
						}
					]
				}
			];

			// Act
			render(
				<TestWrapper testCredentials={dummyCredentials}>
					<OllamaCredentialsFormDialog />
				</TestWrapper>
			);

			const serverAddButton = screen.getByTestId("ServerAddButton");

			await userEvent.click(serverAddButton);

			const form = screen.getByTestId("OllamaCredentialsForm");

			const credentialNameInput = screen.getByTestId("CredentialName");
			const credentialTokenInput = screen.getByTestId("CredentialToken");
			const credentialEndpointUrlInput = screen.getByTestId("CredentialUrl");

			await userEvent.type(credentialNameInput, dummyCredentials[0].name);
			await userEvent.type(credentialTokenInput, dummyCredentials[0].token);
			await userEvent.type(credentialEndpointUrlInput, dummyCredentials[0].endpointUrl);

			fireEvent.submit(form);

			const serverAddButton2 = screen.getByTestId("ServerAddButton");

			await userEvent.click(serverAddButton2);

			const form2 = screen.getByTestId("OllamaCredentialsForm");

			const credentialNameInput2 = screen.getByTestId("CredentialName");
			const credentialTokenInput2 = screen.getByTestId("CredentialToken");
			const credentialEndpointUrlInput2 = screen.getByTestId("CredentialUrl");

			await userEvent.type(credentialNameInput2, dummyCredentials[0].name);
			await userEvent.type(credentialTokenInput2, dummyCredentials[0].token);
			await userEvent.type(credentialEndpointUrlInput2, dummyCredentials[0].endpointUrl);

			fireEvent.submit(form2);

			// Assert
			await waitFor(() => {
				expect(addCredentialMock).toHaveBeenCalledTimes(2);
			});
		});

		it("should close addCredentials when abbrecehn button ist clicked", async () => {
			const dummyCredentials: OllamaCredToggle[] = [
				{
					id: "",
					name: "TestModel1",
					token: "234234334",
					endpointUrl: "http://test.de",
					available: true,
					ollamaModels: [
						{
							id: "",
							name: "",
							toggle: false,
							ollamaCredentialsId: ""
						}
					]
				}
			];

			// Act
			render(
				<TestWrapper testCredentials={dummyCredentials}>
					<OllamaCredentialsFormDialog />
				</TestWrapper>
			);

			const serverAddButton = screen.getByTestId("ServerAddButton");

			await userEvent.click(serverAddButton);

			const abbrechenButton = screen.getByTestId("AbbrechenButton");

			await userEvent.click(abbrechenButton);

			// Assert
			await waitFor(() => {
				expect(addCredentialMock).toHaveBeenCalledTimes(0);
				expect(screen.queryByTestId("addServerDialog")).toBeNull();
			});
		});
	});

	describe("CredentialsFormDialog", () => {
		it("submits form via OllamaCredentialsFormDialog and triggers all async logic (addCredentials + getModels)", async () => {
			const mockSetCredentials = jest.fn();

			addCredentialMock.mockResolvedValue({
				id: "cred-test",
				name: "New Server",
				token: "token123",
				endpointUrl: "http://localhost"
			});

			getModelsMock.mockResolvedValue({
				success: true,
				models: ["llama2", "mistral"]
			});

			render(
				<CredentialsContext.Provider
					value={{ credentials: [], setCredentials: mockSetCredentials }}
				>
					<OllamaCredentialsFormDialog />
				</CredentialsContext.Provider>
			);

			await userEvent.click(screen.getByTestId("ServerAddButton"));

			await userEvent.type(screen.getByTestId("CredentialName"), "New Server");
			await userEvent.type(screen.getByTestId("CredentialToken"), "token123");
			await userEvent.type(screen.getByTestId("CredentialUrl"), "http://localhost:1234");

			fireEvent.submit(screen.getByTestId("OllamaCredentialsForm"));

			await waitFor(() => {
				expect(addCredentialMock).toHaveBeenCalledTimes(1);
				expect(getModelsMock).toHaveBeenCalledTimes(1);
				expect(mockSetCredentials).toHaveBeenCalledTimes(1);
			});
		});
	});


	describe("OllamaModelForm", () => {
		beforeEach(() => {
			addModelMock.mockClear();
		});

		it("Should call addModel with model B after toggling", async () => {
			// Arrange
			const dummyCredentials = [
				{
					id: "cred1",
					name: "Klaus",
					endpointUrl: "",
					token: "",
					available: true,
					ollamaModels: [
						{
							id: "modelA",
							name: "Model A",
							ollamaCredentialsId: "cred1",
							toggle: true
						},
						{
							id: "modelB",
							name: "Model B",
							ollamaCredentialsId: "cred1",
							toggle: false
						}
					]
				}
			];

			// Act
			render(
				<TestWrapper testCredentials={dummyCredentials}>
					<OllamaModelForm />
				</TestWrapper>
			);

			const form = screen.getByTestId("OllamaModelForm");

			const checkboxes = screen.getAllByRole("checkbox");
			const modelInputA = checkboxes[0];
			const modelInputB = checkboxes[1];

			await userEvent.click(modelInputB);
			await userEvent.click(modelInputA);

			fireEvent.submit(form);

			// Assert
			await waitFor(() => {
				expect(addModelMock).toHaveBeenCalledTimes(1)
				expect(addModelMock).toHaveBeenCalledWith({
					id: null,
					name: "Model A",
					ollamaCredentialsId: "cred1",
					toggle: true
				});
			});
		});

		it("should call addModel only once even if two models are toggled true in the same credentials", async () => {
			// Arrange
			const dummyCredentials = [
				{
					id: "cred1",
					name: "Klaus",
					endpointUrl: "http://test.com",
					token: "",
					available: true,
					ollamaModels: [
						{
							id: "modelA",
							name: "Model A",
							ollamaCredentialsId: "cred1",
							toggle: true
						},
						{
							id: "modelB",
							name: "Model B",
							ollamaCredentialsId: "cred1",
							toggle: true
						}
					]
				}
			];

			// Act
			render(
				<TestWrapper testCredentials={dummyCredentials}>
					<OllamaModelForm />
				</TestWrapper>
			);

			const form = screen.getByTestId("OllamaModelForm");

			fireEvent.submit(form);

			// Assert
			await waitFor(() => {
				expect(addModelMock).toHaveBeenCalledTimes(1)
				expect(addModelMock).toHaveBeenCalledWith({
					id: null,
					name: "Model A",
					ollamaCredentialsId: "cred1",
					toggle: true
				});
			});
		});

		it("Should removeCredentials with id: cred2", async () => {
			// Arrange
			const dummyCredentials = [
				{
					id: "cred1",
					name: "Klaus",
					endpointUrl: "",
					token: "",
					available: true,
					ollamaModels: [
						{
							id: "modelA",
							name: "Model A",
							ollamaCredentialsId: "cred1",
							toggle: true
						},
						{
							id: "modelB",
							name: "Model B",
							ollamaCredentialsId: "cred1",
							toggle: false
						}
					]
				},
				{
					id: "cred2",
					name: "Rami",
					endpointUrl: "https://chatgpt.com",
					token: "sdfsadf",
					available: true,
					ollamaModels: [
						{
							id: "modelA",
							name: "Model A",
							ollamaCredentialsId: "cred1",
							toggle: true
						},
						{
							id: "modelB",
							name: "Model B",
							ollamaCredentialsId: "cred1",
							toggle: false
						}
					]
				}
			];

			// Act
			render(
				<TestWrapper testCredentials={dummyCredentials}>
					<OllamaModelForm />
				</TestWrapper>
			);

			const credentialsRemoveButtonB = screen.getByTestId(`CredentialsRemoveButton+${dummyCredentials[1].id}`)

			await userEvent.click(credentialsRemoveButtonB);

			// Assert
			await waitFor(() => {
				expect(removeCredentialMock).toHaveBeenCalledTimes(1)
				expect(removeCredentialMock).toHaveBeenCalledWith({id: dummyCredentials[1].id})
			});
		});
	});

	describe("useCredentialsContext", () => {
		let consoleErrorSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {
			});
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		it("throws an error when used outside the CredentialsContext provider", () => {
			expect(() => renderHook(() => useCredentialsContext())).toThrowError(
				"useCrednetialsContext must be used within OllamaConfigPage"
			);
		});

		it("returns the correct context value when inside the provider", () => {
			const mockContextValue: CredentialsContextType = {
				credentials: [],
				setCredentials: jest.fn(),
			};

			const wrapper = ({children}: { children: React.ReactNode }) => (
				<CredentialsContext.Provider value={mockContextValue}>{children}</CredentialsContext.Provider>
			);

			const {result} = renderHook(() => useCredentialsContext(), {wrapper});

			expect(result.current).toEqual(mockContextValue);
		});
	});


	describe("getCredentials", () => {
		it("fetches credentials and transforms them correctly", async () => {
			const mockData = [
				{
					id: "1",
					name: "Test Credential",
					token: "test123",
					endpointUrl: "https://example.com",
					ollamaModels: [
						{id: "101", name: "Model A", ollamaCredentialsId: "1"},
						{id: "102", name: "Model B", ollamaCredentialsId: "1"},
					],
				},
			];

			database.ollamaCredentials.findMany.mockResolvedValue(mockData);

			const result = await getCredentials();

			expect(result).toEqual([
				{
					id: "1",
					name: "Test Credential",
					token: "test123",
					endpointUrl: "https://example.com",
					available: true,
					ollamaModels: [
						{id: "101", name: "Model A", ollamaCredentialsId: "1", toggle: true},
						{id: "102", name: "Model B", ollamaCredentialsId: "1", toggle: true},
					],
				},
			]);

			expect(database.ollamaCredentials.findMany).toHaveBeenCalledTimes(1);
		});
	});
});
