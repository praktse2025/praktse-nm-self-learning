import React from "react";
import { database } from "@self-learning/database";
import { GetServerSideProps } from "next";
import { withAuth } from "../../../../libs/data-access/api/src/lib/auth/with-auth-ssr";
import { OllamaModelForm, onModelSubmit } from "../../../../libs/feature/admin/src/lib/ollama/edit-ollamaConfig";

export type OllamaCredToggle = Awaited<ReturnType<typeof getCredentials>>[number]

// Get credentials data from the database
export async function getCredentials() {
	const credentials = await database.ollamaCredentials.findMany({
		select: {
			id: true,
			token: true,
			endpointUrl: true,
			ollamaModels: {
				select: {
					id: true,
					name: true,
					ollamaCredentialsId: true,
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
					toggle: false
				};
			})
		};
	});
}

// Server side props with authentication
export const getServerSideProps: GetServerSideProps = withAuth(async (context, user) => {
	const credentials = await getCredentials();
	// credentials.ollamaModels.append(getOllamaModels());
	return {
		props: {
			credentials // Pass the credentials data as a prop to your page
		}
	};
});

// The main component for the form

// Page component
export default function OllamaConfigPage({ credentials }: { credentials: OllamaCredToggle[] }) {
	return (
		<div className="bg-gray-50">
			<center>
				<div>
					<OllamaModelForm
						credentials={credentials}
						onSubmit={onModelSubmit}
					/>
				</div>
			</center>
		</div>
	);
}
