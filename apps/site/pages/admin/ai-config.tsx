import React, {useState} from "react";
import {GetServerSideProps} from "next";
import {withAuth} from "@self-learning/api";
import {
	CredentialsContext,
	getUpdatedCredentials,
	OllamaCredentialsFormDialog,
	OllamaCredToggle,
	OllamaModelForm
} from "@self-learning/admin";

export const getServerSideProps: GetServerSideProps = withAuth(async (context, user) => {
	return {
		props: {
			credentials: await getUpdatedCredentials()
		}
	};
});

export default function AiConfigPage({credentials}: { credentials: OllamaCredToggle[] }) {
	const [credentialsState, setCredentialsState] = useState<OllamaCredToggle[]>(credentials);

	return (
		<CredentialsContext.Provider
			value={{credentials: credentialsState, setCredentials: setCredentialsState}}
		>
			<div className="bg-gray-50 min-h-screen flex justify-center py-10">
				<div className="w-full max-w-2xl flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">Server</h1>
						<OllamaCredentialsFormDialog/>
					</div>

					<div className="flex flex-col gap-4">
						<OllamaModelForm/>
					</div>
				</div>
			</div>
		</CredentialsContext.Provider>
	);
}
