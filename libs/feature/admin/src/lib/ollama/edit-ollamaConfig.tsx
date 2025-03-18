import React, {BaseSyntheticEvent, useState} from "react";
import {trpc} from "@self-learning/api-client";
import {FormProvider, SubmitHandler, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Dialog, DialogActions, showToast, Toggle} from "@self-learning/ui/common";
import {OllamaCredToggle} from "../../../../../../apps/site/pages/admin/ollamaConfig";
import {
	authorSchema,
	OllamaCredentialsFormSchema,
	OllamaCredentialsSchema,
	OllamaModelsSchema
} from "@self-learning/types";
import {OllamaCredentials, OllamaModels} from "@prisma/client";
import {LabeledField, OpenAsJsonButton} from "@self-learning/ui/forms";

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

type CredentialsFormData = {
	id: string | null;
	name: string;
	token: string;
	endpointUrl: string;
};

export function onCredentialsSubmit( data: CredentialsFormData) {
	console.log("Hallo")
	const {mutateAsync: addCredentials} = trpc.ollamaConfig.addCredentials.useMutation();
	const updatedData = {
		id: data.id,
		name: data.name,
		token: data.token,
		endpointUrl: data.endpointUrl,
		ollamaModels: [],
	}
	addCredentials(updatedData);
}
export function Credentials({ credentials }: { credentials: OllamaCredToggle[] }) {
	// Assuming you just want to ensure the 'ollamaModels' property is properly type
	const updatedCredentials = credentials.map(creds => ({
		id: creds.id,
		name: creds.name,
		token: creds.token,
		endpointUrl: creds.endpointUrl,
		ollamaModels: creds.ollamaModels.map(model => ({
			id: model.id,
			name: model.name,
			ollamaCredentialsId: model.ollamaCredentialsId,
		})),
	}));

	return (
		<div>
			<OllamaCredentialsForm onSubmit={onCredentialsSubmit}/>
		</div>

	);
}

export function OllamaCredentialsForm({
										  onSubmit,
									  }: {
	onSubmit: (schema:  z.infer<typeof OllamaCredentialsFormSchema>) => void;
}) {
	// Use the correct type for useForm
	const form = useForm<CredentialsFormData>({
		resolver: zodResolver(OllamaCredentialsFormSchema), // Assuming this is a valid schema
	});

	// Handle form submission
	const handleSubmit = form.handleSubmit(onSubmit);

	return (
		<FormProvider {...form}>
			<form data-testid="OllamaCredentialsForm" onSubmit={handleSubmit}>
				<LabeledField label="">
					<input
						{...form.register("id")}
						type="hidden"
						data-testid="CredentialId"
 					/>
				</LabeledField>
				<LabeledField label="Name" >
					<input
						{...form.register("name")}
						type="text"
						className="textfield"
						placeholder="Name des Servers"
						data-testid="CredentialName"
					/>
				</LabeledField>
				<LabeledField label="Token" >
					<input
						{...form.register("token")}
						type="text"
						className="textfield"
						placeholder="Token"
						data-testid="CredentialToken"

					/>
				</LabeledField>
				<LabeledField label="Endpoint-URL" >
					<input
						{...form.register("endpointUrl")}
						type="text"
						className="textfield"
						placeholder="URL des Servers"
						data-testid="CredentialUrl"
					/>
				</LabeledField>
				<button className="btn-primary" type="submit">
					Speichern
				</button>
			</form>
		</FormProvider>
	);
}


export function onModelSubmit(credentials: OllamaCredToggle[]) {
	const {mutateAsync: addModel} = trpc.ollamaConfig.addModel.useMutation();
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



