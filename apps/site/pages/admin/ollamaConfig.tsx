import React from "react";
import { database } from "@self-learning/database";
import { GetServerSideProps } from "next";
import { withAuth } from "@self-learning/api";
import { OllamaCredentialsForm, OllamaModelForm } from "@self-learning/admin";
import { getAvailableOllamaModels } from "data-access/ollama";

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
	return (
		<div className="bg-gray-50">
			<center>
				<div className="grid h-screen grid-cols-2">
					<div>
						<OllamaCredentialsForm />
					</div>
					<div className={"grid grid-cols-2 flex-col"}>
						<OllamaModelForm credentials={credentials} />
					</div>
				</div>
			</center>
		</div>
	);
}
