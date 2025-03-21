// edit-ollamaConfig.spec.tsx
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	ControlledOllamaCredentialsFormDialog,
	ControlledOllamaModelForm, CredentialsContext, OllamaCredToggle
} from "./edit-ollamaConfig";
import {TextEncoder, TextDecoder} from 'util';
import type {GetServerSidePropsContext} from "next";
import {createContext, useContext, useState} from "react";

Object.assign(global, {TextDecoder, TextEncoder});

// Create a mocked mutation function
const addModelMock = jest.fn();
const addCredentialMock = jest.fn();

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

function TestWrapper({testCredentials, children}: { testCredentials: OllamaCredToggle[], children: any }) {
	const [credentials, setCredentials] = useState<OllamaCredToggle[]>(testCredentials);
	return (
		<CredentialsContext.Provider value={{credentials, setCredentials}}>
			{children}
		</CredentialsContext.Provider>
	);
}


describe("OllamaCredentialsForm", () => {
	beforeEach(() => {
		addCredentialMock.mockClear();
	});
	// Arrange
	it("should call addCredentials when add button ist clicked", async () => {
		const dummyCredentials: OllamaCredToggle[] = [{
			id: "",
			name: "TestModel1",
			token: "234234334",
			endpointUrl: "http://test.de",
			ollamaModels: [{
				id: "",
				name: "",
				toggle: false,
				ollamaCredentialsId: ""
			}]
		}]
		const expectedCredentials = {
			name: "TestModel1",
			token: "234234334",
			endpointUrl: "http://test.de"
		}

		// Act
		render(
			<TestWrapper testCredentials={dummyCredentials}>
				<ControlledOllamaCredentialsFormDialog onSubmit={addCredentialMock}/>
			</TestWrapper>
		);

		const serverAddButton = screen.getByTestId("ServerAddButton")

		await userEvent.click(serverAddButton);

		const form = screen.getByTestId("OllamaCredentialsForm");

		const credentialNameInput = screen.getByTestId("CredentialName")
		const credentialTokenInput = screen.getByTestId("CredentialToken")
		const credentialEndpointUrlInput = screen.getByTestId("CredentialUrl")

		await userEvent.type(credentialNameInput, dummyCredentials[0].name)
		await userEvent.type(credentialTokenInput, dummyCredentials[0].token)
		await userEvent.type(credentialEndpointUrlInput, dummyCredentials[0].endpointUrl)

		fireEvent.submit(form);

		// Assert
		await waitFor(() => {
			expect(addCredentialMock).toHaveBeenCalledTimes(1)
			expect(addCredentialMock).toHaveBeenCalledWith(expectedCredentials)
		});


	});

})


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
				<ControlledOllamaModelForm onSubmit={addModelMock}/>
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
			expect(addModelMock).toHaveBeenCalledWith(dummyCredentials)
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
				<ControlledOllamaModelForm onSubmit={addModelMock}/>
			</TestWrapper>
		);

		const form = screen.getByTestId("OllamaModelForm");

		fireEvent.submit(form);

		// Assert
		await waitFor(() => {
			expect(addModelMock).toHaveBeenCalledTimes(1)
			expect(addModelMock).toHaveBeenCalledWith(dummyCredentials)
		});
	});
});
