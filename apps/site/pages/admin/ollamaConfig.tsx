import React, { useState } from 'react';
import { OnDialogCloseFn, Toggle } from "@self-learning/ui/common";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { database } from "@self-learning/database";
import { OllamaCredentials, OllamaModels } from "@prisma/client";
import { trpc } from "@self-learning/api-client";
import { GetServerSideProps } from "next";
import { withAuth } from "../../../../libs/data-access/api/src/lib/auth/with-auth-ssr";

const mockOllamaModels = [
	{
		id: '123e4567-e89b-12d3-a456-426614174001', // Example UUID
		name: 'Model A',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174000', // Reference to an OllamaCredentials ID
		toggle: false, // You can set this to false or modify it as needed
	},
	{
		id: '123e4567-e89b-12d3-a456-426614174002', // Example UUID
		name: 'Model B',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174000', // Reference to an OllamaCredentials ID
		toggle: false, // You can set this to false or modify it as needed
	},
	{
		id: '123e4567-e89b-12d3-a456-426614174003', // Example UUID
		name: 'Model C',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174001', // Reference to an OllamaCredentials ID
		toggle: false, // You can set this to false or modify it as needed
	},
];

export async function getOllamaModels() {
	// This function will return the mocked OllamaModels data
	return mockOllamaModels;
}

// Zod schemas
export const OllamaCredentialsSchema = z.object({
	id: z.string().uuid().nullable(),
	token: z.string(),
	endpointUrl: z.string().url(),
	ollamaModels: z.array(
		z.object({
			id: z.string().uuid(),
			name: z.string(),
			ollamaCredentialsId: z.string().uuid(),
		})
	).nullable(),
});

// Zod schema for OllamaModels model
export const OllamaModelsSchema = z.object({
	id: z.string().uuid().nullable(),
	name: z.string(),
	ollamaCredentialsId: z.string().uuid(),
});

// Get credentials data from the database
export async function getCredentials() {
	const credentials = await database.ollamaCredentials.findMany({
		select: {
			id: true,
			token: true,
			endpointUrl: true,
			ollamaModels: true,
		},
	});
	const updatedCredentials = credentials.map(creds => {
		return {
			...creds,
			ollamaModels: creds.ollamaModels.map(model => {
				return {
					...model,
					toggle: false, // Initial toggle value is false
				};
			}),
		};
	});
	return updatedCredentials;
}

// Server side props with authentication
export const getServerSideProps: GetServerSideProps = withAuth(
	async (context, user) => {
		const credentials = await getCredentials();
		// credentials.ollamaModels.append(getOllamaModels());
		return {
			props: {
				credentials, // Pass the credentials data as a prop to your page
			},
		};
	});

// The main component for the form
export function OllamaDropdownForm({ credentials }: { credentials: OllamaCredentials[] }) {
	const [isOpen, setIsOpen] = useState(false);
	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};
	const [credentialsState, setCredentialState] = useState(credentials);

	// Hook for handling the form submission
	const { mutateAsync: addModel } = trpc.ollamaConfig.addModel.useMutation();
	const form = useForm({
		resolver: zodResolver(z.array(OllamaModelsSchema)),
		defaultValues: credentials.map(creds => ({
			ollamaModels: creds.ollamaModels.map(model => ({
				id: model.id,
				name: model.name,
				ollamaCredentialsId: model.ollamaCredentialsId,
				toggle: model.toggle,
			})),
		})),
	});

	// Handles toggle value update
	const handleToggleChange = (credsIndex: number, modelIndex: number) => {
		const updatedCredentials = credentials.map((creds) => {
			creds.ollamaModels.forEach((model) => {
				model.toggle = false;  // Set toggle to false for each model
				return model;
			});
			return creds;  // No need to return any JSX
		})
		updatedCredentials[credsIndex].ollamaModels[modelIndex].toggle = true;
		setCredentialState(updatedCredentials);


	};

	// Handles form submission
	const onSubmit = async (data: any) => {
		data.ollamaModels.forEach((cred: any) => {
			cred.ollamaModels.forEach((model: any) => {
				if (model.toggle) {
					// Send to the server-side function to add the model
					addModel(model);
				}
			});
		});
	};

	return (
		<div>
			<div className="grid grid-cols-2 gap-4">

				<div>01</div>
				<div>02</div>
				<div className="col-span-3 grid grid-cols-subgrid gap-4">
					<div className="col-start-2">03</div>
					<div className="col-start-8">04</div>
				</div>
			</div>

				<div>
					Deine Mutter Server 1
				</div>

				<div>
					<ul className="absolute right-0 mt-2 w-48 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-lg z-10">
						<FormProvider {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)}>
								{credentials.map((creds, credsIndex) => {
									return creds.ollamaModels.map((model, modelIndex) => (
										<li
											key={model.id} // Use model.id as the key
											className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
										>
											<Toggle
												value={model.toggle} // Bind the toggle to the model's toggle value
												onChange={() => handleToggleChange(credsIndex, modelIndex)} // Update the toggle on change
												label={model.name} // Show the model name
											/>
										</li>
									));
								})}
								<button type="submit" className="btn-primary w-full">
									Speichern
								</button>
							</form>
						</FormProvider>
					</ul>
				</div>

		</div>
	);
}

// Page component
export default function OllamaConfigPage({ credentials }: { credentials: OllamaCredentials[] }) {
	return (
		<div className="bg-gray-50">
			<center>
				<div>
					<OllamaDropdownForm credentials={credentials} />
				</div>
			</center>
		</div>
	);
}
