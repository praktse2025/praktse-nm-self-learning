import React, { useState } from "react";
import { trpc } from "@self-learning/api-client";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, GreyBoarderButton, showToast, Toggle } from "@self-learning/ui/common";
import { OllamaCredentialsFormSchema, OllamaModelsSchema } from "@self-learning/types";
import { OllamaCredToggle } from "../../../../../../apps/site/pages/admin/ollamaConfig";
import { LabeledField } from "@self-learning/ui/forms";

type CredentialsFormData = {
	name: string;
	token: string;
	endpointUrl: string;
};

export function CredentialSection({ credentials }: { credentials: OllamaCredToggle[] }) {
	return (
		<div>
			<OllamaCredentialsFormDialog />
		</div>
	);
}

export function ControlledOllamaCredentialsFormDialog({
	onSubmit
}: {
	onSubmit: (data: CredentialsFormData) => void;
}) {
	const [dialogOpen, setDialogOpen] = useState<boolean>(true);

	const form = useForm({
		resolver: zodResolver(OllamaCredentialsFormSchema),
		defaultValues: {
			name: "",
			token: "",
			endpointUrl: ""
		}
	});

	function submit(data: CredentialsFormData) {
		onSubmit(data);
		setDialogOpen(false);
	}

	const handleSubmit = form.handleSubmit(submit);

	return (
		dialogOpen && (
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

						<GreyBoarderButton onClick={() => setDialogOpen(false)}>
							<span className={"text-gray-600"}>Abbrechen</span>
						</GreyBoarderButton>
						<button className="btn-primary" type="submit">
							Speichern
						</button>
					</form>
				</FormProvider>
			</Dialog>
		)
	);
}

export function OllamaCredentialsFormDialog() {
	const { mutateAsync: addCredentials } = trpc.ollamaConfig.addCredentials.useMutation();
	const { mutateAsync: removeCredentials } = trpc.ollamaConfig.removeCredentials.useMutation();

	async function onSubmit(data: CredentialsFormData) {
		console.log("fjslgdklshgkfdhjk");

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
			<button className="btn-primary" onClick={() => removeCredentials({id: "8ae7a7b4-8b82-46ab-b23f-9506fd08e060"})}>
				remove
			</button>
			<ControlledOllamaCredentialsFormDialog onSubmit={onSubmit} />
		</div>
	);
}

export function OllamaModelForm({ credentials }: { credentials: OllamaCredToggle[] }) {
	const { mutateAsync: addModel } = trpc.ollamaConfig.addModel.useMutation();

	async function onSubmit(credentials: OllamaCredToggle[]) {
		let firstRun = true;

		for (const cred of credentials) {x
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
			<ControlledOllamaModelForm credentials={credentials} onSubmit={onSubmit} />
		</div>
	);
}

export function ControlledOllamaModelForm({
	credentials,
	onSubmit
}: {
	credentials: OllamaCredToggle[];
	onSubmit: (credentials: OllamaCredToggle[]) => void;
}) {
	const [credentialsState, setCredentialState] = useState(credentials);

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
		const updatedCredentials = credentialsState.map(creds => {
			creds.ollamaModels.forEach(model => {
				model.toggle = false; // Reset all toggles to false
			});
			return creds;
		});
		updatedCredentials[credsIndex].ollamaModels[modelIndex].toggle = true;
		setCredentialState([...updatedCredentials]);
	};

	return (
		<div>
			<ul>
				<FormProvider {...form}>
					<form
						onSubmit={e => {
							e.preventDefault();
							onSubmit(credentialsState);
						}}
						data-testid="OllamaModelForm"
					>
						<div>
							{credentialsState.map((creds, credsIndex) =>
								creds.ollamaModels.map((model, modelIndex) => (
									<div key={model.id}>
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
