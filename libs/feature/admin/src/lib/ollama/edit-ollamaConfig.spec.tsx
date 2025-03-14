// edit-ollamaConfig.spec.tsx
import { OllamaModelForm, onModelSubmit } from "./edit-ollamaConfig";
import { fireEvent, render, screen } from "@testing-library/react";

// Create a mocked mutation function
const mockedMutateAsync = jest.fn();

// Fully mock the TRPC hook so that useMutation returns our mock
jest.mock("@self-learning/api-client", () => ({
	trpc: {
		ollamaConfig: {
			addModel: {
				useMutation: () => ({
					mutateAsync: mockedMutateAsync
				})
			}
		}
	}
}));

describe("OllamaModelForm", () => {
	beforeEach(() => {
		mockedMutateAsync.mockClear();
	});

	it("should call addModel when a single model is toggled true", () => {
		// Arrange: One credentials object with one toggled model.
		const dummyCredentials = [
			{
				id: "cred1",
				endpointUrl: "",
				token: "",
				ollamaModels: [
					{
						id: "modelA",
						name: "Model A",
						ollamaCredentialsId: "cred1",
						toggle: true // Only this model is toggled true.
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
		onModelSubmit(dummyCredentials);

		// Assert: Expect addModel to be called exactly once.
		expect(mockedMutateAsync).toHaveBeenCalledTimes(1);
		expect(mockedMutateAsync).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "modelA",
				name: "Model A",
				ollamaCredentialsId: "cred1"
			})
		);
	});

	it("should call addModel only once even if two models are toggled true in the same credentials", () => {
		// Arrange: One credentials object with two models toggled true.
		const dummyCredentials = [
			{
				id: "cred1",
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

		// Act
		onModelSubmit(dummyCredentials);

		// Assert: Even though two models are toggled true,
		expect(mockedMutateAsync).toHaveBeenCalledTimes(1);
		// Optionally, you can check that the call was made with the first toggled model's data.
		expect(mockedMutateAsync).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "modelA",
				name: "Model A",
				ollamaCredentialsId: "cred1"
			})
		);
	});

	it("should call onSubmit on Speicher-Button press", async () => {
		//Arrange
		const dummyModelA = {
			id: "modelA",
			name: "Model A",
			ollamaCredentialsId: "cred1",
			toggle: true // Only this model is toggled true.
		};

		const dummyModelB = {
			id: "modelB",
			name: "Model B",
			ollamaCredentialsId: "cred1",
			toggle: false
		};

		const dummyCredentials = [
			{
				id: "cred1",
				endpointUrl: "http://endpoint.net",
				token: "token",
				ollamaModels: [dummyModelA, dummyModelB]
			}
		];

		const onSubmitMock = jest.fn();

		//Act

		render(<OllamaModelForm credentials={dummyCredentials} onSubmit={onSubmitMock} />);

		const form = screen.getByTestId("OllamaModelForm");
		fireEvent.submit(form);

		//Assert

		expect(onSubmitMock).toHaveBeenCalledWith(dummyCredentials);
	});
});
