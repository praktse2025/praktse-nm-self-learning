import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Correct import
import { OllamaConfigForm } from '../../pages/admin/ollamaConfig'; // Ensure proper import
import { trpc } from '@self-learning/api-client';

const mockOllamaModels = [
	{
		id: '123e4567-e89b-12d3-a456-426614174001',
		name: 'Model A',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174000',
		toggle: false
	},
	{
		id: '123e4567-e89b-12d3-a456-426614174002',
		name: 'Model B',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174000',
		toggle: false
	},
	{
		id: '123e4567-e89b-12d3-a456-426614174003',
		name: 'Model C',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174001',
		toggle: false
	},
];

jest.mock('@self-learning/api-client', () => ({
	trpc: {
		ollamaConfig: {
			addModel: {
				useMutation: jest.fn(() => ({
					mutateAsync: jest.fn(),
				})),
			},
		},
	},
}));

jest.mock('../../pages/admin/ollamaConfig', () => ({
	getServerSideProps: jest.fn().mockResolvedValue({
		props: {
			credentials: [
				{
					id: '123',
					token: 'some-token',
					endpointUrl: 'https://example.com',
					ollamaModels: mockOllamaModels,
				},
			],
		},
	}),
}));

describe('OllamaConfigForm', () => {
	it('should call addModel when toggle is changed and form is submitted', async () => {
		// Arrange
		const addModelMock = trpc.ollamaConfig.addModel.useMutation().mutateAsync;

		render(<OllamaConfigForm credentials={[{ id: '123', ollamaModels: mockOllamaModels }]} />);

		// Act: Trigger toggle change for a model using userEvent
		const toggleButtons = screen.getAllByRole('checkbox'); // Assuming the Toggle component uses checkboxes
		await userEvent.click(toggleButtons[0]); // Simulate a user clicking the first model's toggle

		// Act: Submit the form
		const submitButton = screen.getByText('Speichern');
		await userEvent.click(submitButton);

		// Assert: Ensure that mutateAsync was called with the correct model data
		await waitFor(() => expect(addModelMock).toHaveBeenCalledTimes(1)); // Ensure it was called once

		// Check if the mutateAsync function was called with the correct arguments
		expect(addModelMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: mockOllamaModels[0].id, // Ensure the correct model is passed
				name: mockOllamaModels[0].name,
				ollamaCredentialsId: mockOllamaModels[0].ollamaCredentialsId,
			})
		);
	});
});
