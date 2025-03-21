import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { withAuth } from "@self-learning/api";
import {
	CredentialsContext,
	CredentialSection,
	getCredentials,
	OllamaCredToggle,
	OllamaModelForm
} from "@self-learning/admin";
import { getAvailableModelsOnEndpoint } from "../../../../libs/data-access/api-client/src/lib/ollama";

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

export default function OllamaConfigPage({ credentials }: { credentials: OllamaCredToggle[] }) {
	const [credentialsState, setCredentialsState] = useState<OllamaCredToggle[]>(credentials);
	return (
		<CredentialsContext.Provider
			value={{ credentials: credentialsState, setCredentials: setCredentialsState }}
		>
			<div className="bg-gray-50 flex items-center justify-center h-screen">
				<div className="grid grid-cols-3 gap-4 w-10/12 max-w-screen-md items-center">
					<div className="col-span-2 flex justify-center">
						<div className="w-11/12">
							<CredentialSection />
						</div>
					</div>

					{/* Right Side - Model Selection, Centered */}
					<div className="flex justify-center">
						<OllamaModelForm />
					</div>
				</div>
			</div>
		</CredentialsContext.Provider>
	);
}
