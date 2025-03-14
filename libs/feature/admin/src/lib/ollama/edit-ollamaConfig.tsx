import {OllamaCredentials} from "@prisma/client";
import React, {useState} from "react";
import {trpc} from "@self-learning/api-client";
import {FormProvider, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Toggle} from "@self-learning/ui/common";
import {OllamaModelsSchema} from "../../../../../../apps/site/pages/admin/ollamaConfig";

export function OllamaConfigForm({ credentials }: { credentials: OllamaCredentials[] }) {
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
			<div className="grid grid-cols-2 gap-4" >
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
