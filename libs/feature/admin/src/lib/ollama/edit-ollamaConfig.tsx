import React, {createContext, useContext, useState} from "react";
import { trpc } from "@self-learning/api-client";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, GreyBoarderButton, showToast, Toggle } from "@self-learning/ui/common";
import { OllamaCredentialsFormSchema, OllamaModelsSchema } from "@self-learning/types";
import {OllamaCredToggle, useCredentialsContext} from "../../../../../../apps/site/pages/admin/ollamaConfig";
import { LabeledField } from "@self-learning/ui/forms";

type CredentialsFormData = {
	id: string;
	name: string;
	token: string;
	endpointUrl: string;
};

export function CredentialSection() {
	const { mutateAsync: removeCredentialFromDB } =
		trpc.ollamaConfig.removeCredentials.useMutation();

	const {credentials, setCredentials} = useCredentialsContext();

	function removeCredential(data: CredentialsFormData) {
		setCredentials(credentials.filter(cred => cred.name !== data.name)); // Remove by name
	}

	function handleRemove(index: number) {
		const credToRemove = credentials[index];
		removeCredential(credToRemove);
		removeCredentialFromDB({ id: credToRemove.id });
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg text-gray-900">Credentials</h2>
				<OllamaCredentialsFormDialog />
			</div>

			<div className="space-y-2">
				{credentials.map((credential, index) => (
					<div
						key={index}
						className="flex items-center justify-between border rounded-lg p-3 shadow-sm bg-white"
					>
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
								<span className="text-gray-700 font-semibold">
									{credential.name.charAt(0).toUpperCase()}
								</span>
							</div>
							<div>
								<p className="font-medium text-gray-900">{credential.name}</p>
								<p className="text-sm text-gray-500">{credential.endpointUrl}</p>
							</div>
						</div>

						<button
							className="text-gray-400 hover:text-red-600"
							onClick={() => handleRemove(index)}
						>
							✕
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

export function ControlledOllamaCredentialsFormDialog({
	onSubmit,
}: {
	onSubmit: (data: CredentialsFormData) => void;
}) {
	const [dialogOpen, setDialogOpen] = useState<boolean>(false);

	const {credentials, setCredentials} = useCredentialsContext();
	function addCredential(data: OllamaCredToggle) {
		setCredentials([...credentials, data]); // Add new credential
	}
	const form = useForm({
		resolver: zodResolver(OllamaCredentialsFormSchema),
		defaultValues: {
			id: "",
			name: "",
			token: "",
			endpointUrl: "",
			ollamaModels: []
		}
	});

	function submit(data: OllamaCredToggle) {
		onSubmit(data);
		addCredential(data);
		setDialogOpen(false);
	}

	const handleSubmit = form.handleSubmit(submit);

	return (
		<div>
			<div>
				<button onClick={() => setDialogOpen(true)} className="btn-primary">
					Server hinzufügen
				</button>
			</div>
			<div>
				{dialogOpen && (
					<Dialog onClose={() => setDialogOpen(false)} title={"Server hinzufügen"}>
						<FormProvider {...form}>
							<form data-testid="OllamaCredentialsForm" onSubmit={handleSubmit}>
								<LabeledField label="Name">
									<input
										{...form.register("name")}
										type="text"
										className="textfield"
										placeholder="Name des Servers"
										data-testid="CredentialName"
									/>
								</LabeledField>
								<LabeledField label="Token">
									<input
										{...form.register("token")}
										type="text"
										className="textfield"
										placeholder="Token"
										data-testid="CredentialToken"
									/>
								</LabeledField>
								<LabeledField label="Endpoint-URL">
									<input
										{...form.register("endpointUrl")}
										type="text"
										className="textfield"
										placeholder="URL des Servers"
										data-testid="CredentialUrl"
									/>
								</LabeledField>

								<div className="flex justify-between w-full py-4">
									<GreyBoarderButton onClick={() => setDialogOpen(false)}>
										<span className="text-gray-600">Abbrechen</span>
									</GreyBoarderButton>
									<button className="btn-primary" type="submit">
										Speichern
									</button>
								</div>
							</form>
						</FormProvider>
					</Dialog>
				)}
			</div>
		</div>
	);
}

export function OllamaCredentialsFormDialog() {
	const { mutateAsync: addCredentials } = trpc.ollamaConfig.addCredentials.useMutation();

	async function onSubmit(data: CredentialsFormData) {
		const updatedData = {
			id: null,
			name: data.name,
			token: data.token,
			endpointUrl: data.endpointUrl,
			ollamaModels: []
		};

		try {
			await addCredentials(updatedData);
			showToast({
				type: "success",
				title: "Erfolg",
				subtitle: "Anmeldeinformationen gespeichert"
			});
		} catch (error) {
			showToast({
				type: "error",
				title: "Fehler",
				subtitle: "Fehler beim Speichern der Daten"
			});
		}
	}

	return (
		<div>
			<ControlledOllamaCredentialsFormDialog
				onSubmit={onSubmit}
			/>
		</div>
	);
}

export function OllamaModelForm() {
	const {credentials, setCredentials} = useCredentialsContext();
	const { mutateAsync: addModel } = trpc.ollamaConfig.addModel.useMutation();

	async function onSubmit(credentials: OllamaCredToggle[]) {
		let firstRun = true;

		for (const cred of credentials) {
			for (const model of cred.ollamaModels) {
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
					try {
						await addModel(model);
						showToast({
							type: "success",
							title: "Erfolg",
							subtitle: `Modell ${model.name} aktiviert`
						});
					} catch (error) {
						console.error("Error activating model:", error);
						showToast({
							type: "error",
							title: "Fehler",
							subtitle: "Fehler beim Aktivieren des Modells"
						});
					}
				}
			}
		}
	}

	return (
		<div>
			<ControlledOllamaModelForm onSubmit={onSubmit}/>
		</div>
	);
}

export function ControlledOllamaModelForm({
	onSubmit
}: {
	onSubmit: (credentials: OllamaCredToggle[]) => void;
}) {
	const {credentials, setCredentials} = useCredentialsContext();

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

	const handleToggleChange = (credsIndex: number, modelIndex: number) => {
		const updatedCredentials = credentials.map(creds => {
			creds.ollamaModels.forEach(model => {
				model.toggle = false; // Reset all toggles to false
			});
			return creds;
		});
		updatedCredentials[credsIndex].ollamaModels[modelIndex].toggle = true;
		setCredentials([...updatedCredentials]);
	};

	return (
		<div>
			{/* Label for the Left Side */}
			<div className="flex items-center justify-between pb-4">
				<h2 className="font-semibold text-lg text-gray-900">Modelle</h2>
			</div>

			<ul>
				<FormProvider {...form}>
					<form
						onSubmit={e => {
							e.preventDefault();
							onSubmit(credentials);
						}}
						data-testid="OllamaModelForm"
					>
						<div>
							{credentials.map((creds, credsIndex) =>
								creds.ollamaModels.map((model, modelIndex) => (
									<div
										key={model.id}
										className="flex items-center space-x-4 py-2"
									>
										<Toggle
											data-testid={`toggle-button+${model.id}`}
											value={model.toggle}
											onChange={() =>
												handleToggleChange(credsIndex, modelIndex)
											}
											label={`${model.name} (${creds.name})`}
										/>
									</div>
								))
							)}
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
