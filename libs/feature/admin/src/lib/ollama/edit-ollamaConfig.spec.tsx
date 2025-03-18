// edit-ollamaConfig.spec.tsx

import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	ControlledOllamaCredentialsForm,
	ControlledOllamaModelForm,
	OllamaCredentialsForm,
	OllamaModelForm
} from "./edit-ollamaConfig";

// Create a mocked mutation function
const addModelMock = jest.fn();
const addCredentialMock = jest.fn();

// Fully mock the TRPC hook so that useMutation returns our mock
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
			}
		}
	}
}));

describe("OllamaCredentialsForm", () => {
	beforeEach(() => {
		addCredentialMock.mockClear();
	});
	it("should call addCredentials when add button ist clicked", async () => {


		const dummyCredentials =
			{
				id: null,
				name: "TestModel1",
				token: "234234334",
				endpointUrl: "http://test.de",
				ollamaModels: []
			};


		const renderedForm = render(<OllamaCredentialsForm />);
		const form = screen.getByTestId("OllamaCredentialsForm");

		const credentialNameInput = screen.getByTestId("CredentialName")
		const credentialTokenInput = screen.getByTestId("CredentialToken")
		const credentialEndpointUrlInput = screen.getByTestId("CredentialUrl")

		await userEvent.type(credentialNameInput, dummyCredentials.name)
		await userEvent.type(credentialTokenInput, dummyCredentials.token)
		await userEvent.type(credentialEndpointUrlInput, dummyCredentials.endpointUrl)

		fireEvent.submit(form);
		await waitFor(() => {
				expect(addCredentialMock).toHaveBeenCalledTimes(1)
				expect(addCredentialMock).toHaveBeenCalledWith(dummyCredentials)
			});
		});

	})


describe("OllamaModelForm", () => {
	beforeEach(() => {
		addModelMock.mockClear();
	});

	it("Should call addModel with model B after toggling", async () => {
		// Arrange: One credentials object with one toggled model.
		const dummyCredentials = [
			{
				id: "cred1",
				name: "Klaus",
				endpointUrl: "",
				token: "",
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


		const renderedForm = render(<OllamaModelForm credentials={dummyCredentials}/>);
		const form = screen.getByTestId("OllamaModelForm");

		const checkboxes = screen.getAllByRole("checkbox");
		const modelInputA = checkboxes[0];
		const modelInputB = checkboxes[1];

		await userEvent.click(modelInputB);
		await userEvent.click(modelInputA);

		fireEvent.submit(form);
		await waitFor(() => {
			expect(addModelMock).toHaveBeenCalledTimes(1)
			expect(addModelMock).toHaveBeenCalledWith(dummyCredentials[0].ollamaModels[0])
		});
	});

	it("should call addModel only once even if two models are toggled true in the same credentials", async () => {
		// Arrange: One credentials object with one toggled model.
		const dummyCredentials = [
			{
				id: "cred1",
				name: "Klaus",
				endpointUrl: "",
				token: "",
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


		const renderedForm = render(<OllamaModelForm credentials={dummyCredentials}/>);
		const form = screen.getByTestId("OllamaModelForm");

		fireEvent.submit(form);
		await waitFor(() => {
			expect(addModelMock).toHaveBeenCalledTimes(1)
			expect(addModelMock).toHaveBeenCalledWith(dummyCredentials[0].ollamaModels[0])
		});
	});
});
