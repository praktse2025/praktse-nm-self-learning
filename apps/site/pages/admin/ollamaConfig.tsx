import React, {createContext, useContext, useState} from "react";
import { database } from "@self-learning/database";
import { GetServerSideProps } from "next";
import { withAuth } from "@self-learning/api";
import { CredentialSection, OllamaModelForm } from "@self-learning/admin";
import { getAvailableOllamaModels } from "data-access/ollama";

type CredentialsContextType = {
	credentials: OllamaCredToggle[];
	setCredentials: (creds: OllamaCredToggle[]) => void;
}
const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

export function useCredentialsContext() {
	const context = useContext(CredentialsContext);
	if(!context) {
		throw new Error("useCrednetialsContext must be used within OllamaConfigPage")
	}
	return context
}

export type OllamaCredToggle = Awaited<ReturnType<typeof getCredentials>>[number];

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

	return credentials.map(creds => {
		return {
			...creds,
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

export const getServerSideProps: GetServerSideProps = withAuth(async (context, user) => {
	const credentials = await getCredentials();

	for (const cred of credentials) {
		const availableModels = await getAvailableOllamaModels(cred.endpointUrl, cred.token);

		if (!availableModels) {
			console.log("Failed to fetch models for credential:", cred.name);
			continue;
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

		cred.ollamaModels.push(...newModels);
	}

	return {
		props: {
			credentials
		}
	};
});

export default function OllamaConfigPage({ credentials }: { credentials: OllamaCredToggle[] }) {
	const [credentialsState, setCredentialsState] = useState<OllamaCredToggle[]>(credentials);
	return (
		<CredentialsContext.Provider value={{credentials: credentialsState, setCredentials: setCredentialsState}}>
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
