import React, { useState } from "react";
import { trpc } from "@self-learning/api-client";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showToast, Toggle } from "@self-learning/ui/common";
import { OllamaCredToggle } from "../../../../../../apps/site/pages/admin/ollamaConfig";
import { OllamaModelsSchema } from "@self-learning/types";
import { OllamaCredentials } from "@prisma/client";

const mockOllamaModels = [
	{
		id: "123e4567-e89b-12d3-a456-426614174001", // Example UUID
		name: "Model A",
		ollamaCredentialsId: "123e4567-e89b-12d3-a456-426614174000", // Reference to an OllamaCredentials ID
		toggle: false // You can set this to false or modify it as needed
	},
	{
		id: "123e4567-e89b-12d3-a456-426614174002", // Example UUID
		name: "Model B",
		ollamaCredentialsId: "123e4567-e89b-12d3-a456-426614174000", // Reference to an OllamaCredentials ID
		toggle: false // You can set this to false or modify it as needed
	},
	{
		id: "123e4567-e89b-12d3-a456-426614174003", // Example UUID
		name: "Model C",
		ollamaCredentialsId: "123e4567-e89b-12d3-a456-426614174001", // Reference to an OllamaCredentials ID
		toggle: false // You can set this to false or modify it as needed
	}
];

async function getOllamaModels() {
	// This function will return the mocked OllamaModels data
	return mockOllamaModels;
}

export function onModelSubmit(credentials: OllamaCredToggle[]) {
	const { mutateAsync: addModel } = trpc.ollamaConfig.addModel.useMutation();
	let firstRun = true;
	credentials.forEach((cred: OllamaCredToggle) => {
		cred.ollamaModels.forEach(model => {
			if (model.toggle) {
				if (!firstRun) {
					showToast({
						type: "error",
						title: "Fehler",
						subtitle: "Es kann nur ein Modell gleichzeitig aktiviert werden."
					});
					return;
				}
				firstRun = false;
				addModel(model);
			}
		});
	});
}

export function onCredentialSubmit(credential: OllamaCredentials) {
	return null;
}

export function OllamaModelForm({
	credentials,
	onSubmit
}: {
	credentials: OllamaCredToggle[];
	onSubmit: (credentials: OllamaCredToggle[]) => void;
}) {
	const [credentialsState, setCredentialState] = useState(credentials);

	// Hook for handling the form submission
	const form = useForm({
		resolver: zodResolver(z.array(OllamaModelsSchema)),
		defaultValues: credentials.map(creds => ({
			ollamaModels: creds.ollamaModels.map(model => ({
				id: model.id,
				name: model.name,
				ollamaCredentialsId: model.ollamaCredentialsId,
				toggle: model.toggle
			}))
		}))
	});

	// Handles toggle value update
	const handleToggleChange = (credsIndex: number, modelIndex: number) => {
		const updatedCredentials = credentialsState.map(creds => {
			creds.ollamaModels.forEach(model => {
				model.toggle = false; // Set toggle to false for each model
				return model;
			});
			return creds; // No need to return any JSX
		});
		updatedCredentials[credsIndex].ollamaModels[modelIndex].toggle = true;
		setCredentialState(updatedCredentials);
	};

	// Handles form submission

	return (
		<div>
			<ul className="mt-2 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-lg z-10">
				<FormProvider {...form}>
					<form
						onSubmit={() => onSubmit(credentialsState)}
						data-testid="OllamaModelForm"
					>
						<div className="align-left gap-4">
							{credentialsState.map((creds, credsIndex) => {
								return creds.ollamaModels.map((model, modelIndex) => (
									<div
										key={model.id}
										className="p-2 align-left hover:bg-gray-100 cursor-pointer text-left"
									>
										<Toggle
											data-testid={`toggle-button+${model.id}`}
											value={model.toggle}
											onChange={() =>
												handleToggleChange(credsIndex, modelIndex)
											}
											label={model.name + " (" + creds.name + ")"}
										/>
									</div>

								));
							})}
						</div>
						<button type="submit" className="btn-primary w-full mt-4">
							Speichern
						</button>
					</form>
				</FormProvider>
			</ul>
		</div>
	);
}
