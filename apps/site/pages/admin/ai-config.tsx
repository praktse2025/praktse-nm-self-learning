import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { withAuth } from "@self-learning/api";
import {
	CredentialsContext,
	getCredentials, OllamaCredentialsFormDialog,
	OllamaCredToggle,
	OllamaModelForm
} from "@self-learning/admin";
import { getAvailableModelsOnEndpoint } from "@self-learning/api-client";

export const getServerSideProps: GetServerSideProps = withAuth(async (context, user) => {
	const credentials = await getCredentials();

	const updatedCredentials = await Promise.all(
		credentials.map(async cred => {
			const availableModels = await getAvailableModelsOnEndpoint(
				cred.endpointUrl,
				cred.token
			);

			if (!availableModels) {
				cred = {
					...cred,
					available: false
				};
				return cred; // Return the original credential if fetch fails
			}

			const existingModelNames = new Set(cred.ollamaModels.map(model => model.name));

			const newModels = availableModels
				.filter(modelName => !existingModelNames.has(modelName))
				.map(modelName => ({
					id: null,
					name: modelName,
					ollamaCredentialsId: cred.id,
					toggle: false
				}));

			// Return a new object instead of mutating the original one
			return {
				...cred,
				ollamaModels: [...cred.ollamaModels, ...newModels]
			};
		})
	);

	return {
		props: {
			credentials: updatedCredentials
		}
	};
});

export default function AiConfigPage({credentials}: { credentials: OllamaCredToggle[] }) {
	const [credentialsState, setCredentialsState] = useState<OllamaCredToggle[]>(credentials);
	return (
		<CredentialsContext.Provider
			value={{ credentials: credentialsState, setCredentials: setCredentialsState }}
		>
			<div className="bg-gray-50 flex items-center justify-center h-screen">
				<div>
					<span>Server</span>
					<OllamaCredentialsFormDialog/>
				</div>
				<div className="flex justify-center">
					<OllamaModelForm/>
				</div>
			</div>
		</CredentialsContext.Provider>
	);
}
