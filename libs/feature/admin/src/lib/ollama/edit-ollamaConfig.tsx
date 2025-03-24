import React, {createContext, useContext, useState} from "react";
import {trpc} from "@self-learning/api-client";
import {FormProvider, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Dialog,
	GreyBoarderButton, IconButton,
	OutlinedIconButton,
	showToast,
	Toggle
} from "@self-learning/ui/common";
import {OllamaCredentialsFormSchema, OllamaModelsSchema} from "@self-learning/types";
import {LabeledField} from "@self-learning/ui/forms";
import {database} from "@self-learning/database";
import {ExclamationTriangleIcon, TrashIcon} from "@heroicons/react/24/outline";
import {PlusIcon} from "@heroicons/react/24/solid";

export type CredentialsContextType = {
	credentials: OllamaCredToggle[];
	setCredentials: (creds: OllamaCredToggle[]) => void;
};

// Context for storing and managing Ollama credentials
export const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

// Custom hook to use the credentials context safely
export function useCredentialsContext() {
	const context = useContext(CredentialsContext);
	if (!context) {
		// Enforce usage within the appropriate provider
		throw new Error("useCrednetialsContext must be used within OllamaConfigPage");
	}
	return context;
}

export type OllamaCredToggle = Awaited<ReturnType<typeof getCredentials>>[number];

// Fetches stored credentials from the database and returns them in a structured format.
export async function getCredentials() {
	const credentials = await database.ollamaCredentials.findMany({
		select: {
			id: true,
			name: true,
			token: true,
			endpointUrl: true,
			ollamaModels: {
				select: {
					id: true,
					name: true,
					ollamaCredentialsId: true
				}
			}
		}
	});

	// Map over credentials and add a toggle field to models
	return credentials.map(creds => {
		return {
			...creds,
			available: true,
			ollamaModels: creds.ollamaModels.map(model => {
				return {
					...model,
					id: model.id || null,
					toggle: true
				};
			})
		};
	});
}

type CredentialsFormData = {
	id: string;
	name: string;
	token: string;
	endpointUrl: string;
};

// Modal form for adding a new Ollama credential
export function ControlledOllamaCredentialsFormDialog({
														  onSubmit
													  }: {
	onSubmit: (data: CredentialsFormData) => Promise<OllamaCredToggle | null>;
}) {
	const [dialogOpen, setDialogOpen] = useState<boolean>(false);

	const {credentials, setCredentials} = useCredentialsContext();

	// Adds a new credential to the UI state
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
			available: true,
			ollamaModels: []
		}
	});

	// Handles form submission
	async function submit(data: OllamaCredToggle) {
		const submitReturn = await onSubmit(data);

		console.log(submitReturn);

		if (submitReturn) {
			addCredential(submitReturn);
		}
		setDialogOpen(false);
	}

	const handleSubmit = form.handleSubmit(submit);

	return (
		<div>
			<div>
				<OutlinedIconButton
					data-testid="ServerAddButton"
					onClick={() => setDialogOpen(true)}
					text="Hinzufügen"
					icon={<PlusIcon className="icon h-5"/>}
				/>
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
										placeholder="Endpoint-URL"
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
	const {mutateAsync: addCredentials} = trpc.ollamaConfig.addCredentials.useMutation();
	const {mutateAsync: getModels} = trpc.ollama.models.useMutation();

	async function onSubmit(data: CredentialsFormData) {
		const updatedData = {
			id: null,
			name: data.name,
			token: data.token,
			endpointUrl: data.endpointUrl,
			ollamaModels: []
		};

		try {
			const trpcReturn = await addCredentials(updatedData);
			if (trpcReturn) {
				showToast({
					type: "success",
					title: "Erfolg",
					subtitle: "Anmeldeinformationen gespeichert"
				});
			} else {
				showToast({
					type: "error",
					title: "Fehler",
					subtitle: "Der Server mit der URL ist bereits vorhanden"
				});
			}

			const fetchedModels = await getModels({
				endpointUrl: data.endpointUrl,
				token: data.token
			});

			if (
				!trpcReturn ||
				!trpcReturn.id ||
				!trpcReturn.name ||
				!trpcReturn.token ||
				!trpcReturn.endpointUrl
			) {
				throw new Error("trpcReturn is missing required fields");
			}

			return {
				id: trpcReturn.id,
				name: trpcReturn.name,
				token: trpcReturn.token,
				endpointUrl: trpcReturn.endpointUrl,
				available: fetchedModels?.success ?? false,
				ollamaModels: (fetchedModels?.models ?? []).map(modelName => ({
					id: "",
					toggle: false,
					name: modelName,
					ollamaCredentialsId: trpcReturn.id
				}))
			} satisfies OllamaCredToggle;
		} catch (error) {
			showToast({
				type: "error",
				title: "Fehler",
				subtitle: "Fehler beim Speichern der Daten"
			});
			return null;
		}
	}

	return (
		<div>
			<ControlledOllamaCredentialsFormDialog onSubmit={onSubmit}/>
		</div>
	);
}

// Form to manage Ollama models with toggle functionality
export function OllamaModelForm() {
	const {mutateAsync: addModel} = trpc.ollamaConfig.addModel.useMutation();

	// Handles model activation, ensuring only one model is active at a time
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
						await addModel({...model, id: null});
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
	const {mutateAsync: removeCredentialFromDB} =
		trpc.ollamaConfig.removeCredentials.useMutation();
	const {credentials = [], setCredentials} = useCredentialsContext();


	const form = useForm({
		resolver: zodResolver(z.array(OllamaModelsSchema)),
		defaultValues: credentials.map(creds => ({
			ollamaModels: creds.ollamaModels?.map(model => ({
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

// Removes a credential from the UI state
	function removeCredential(data: CredentialsFormData) {
		setCredentials(credentials.filter(cred => cred.name !== data.name)); // Remove by name
	}

// Handles the removal process, updating both UI and DB
	function handleRemove(index: number) {
		const credToRemove = credentials[index];
		removeCredential(credToRemove);
		removeCredentialFromDB({id: credToRemove.id});
	}

	return (
		<div>

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
								<div>
									<span>	{creds.name} </span>
									<TrashIcon className={"text-red-500 h-7 w-7"}
											   onClick={() => handleRemove(credsIndex)}/>
									{creds.ollamaModels?.map((model, modelIndex) => (
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
												label={`${model.name}`}
											/>
										</div>
									))}
								</div>
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
