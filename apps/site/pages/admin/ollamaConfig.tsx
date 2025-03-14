import React, { useState } from 'react';
import { OnDialogCloseFn, Toggle } from "@self-learning/ui/common";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { database } from "@self-learning/database";
import { OllamaCredentials, OllamaModels } from "@prisma/client";
import { trpc } from "@self-learning/api-client";
import { GetServerSideProps } from "next";
import { withAuth } from "../../../../libs/data-access/api/src/lib/auth/with-auth-ssr";
import {OllamaConfigForm} from "../../../../libs/feature/admin/src/lib/ollama/edit-ollamaConfig";

const mockOllamaModels = [
	{
		id: '123e4567-e89b-12d3-a456-426614174001', // Example UUID
		name: 'Model A',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174000', // Reference to an OllamaCredentials ID
		toggle: false, // You can set this to false or modify it as needed
	},
	{
		id: '123e4567-e89b-12d3-a456-426614174002', // Example UUID
		name: 'Model B',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174000', // Reference to an OllamaCredentials ID
		toggle: false, // You can set this to false or modify it as needed
	},
	{
		id: '123e4567-e89b-12d3-a456-426614174003', // Example UUID
		name: 'Model C',
		ollamaCredentialsId: '123e4567-e89b-12d3-a456-426614174001', // Reference to an OllamaCredentials ID
		toggle: false, // You can set this to false or modify it as needed
	},
];

export async function getOllamaModels() {
	// This function will return the mocked OllamaModels data
	return mockOllamaModels;
}

// Zod schemas
export const OllamaCredentialsSchema = z.object({
	id: z.string().uuid().nullable(),
	token: z.string(),
	endpointUrl: z.string().url(),
	ollamaModels: z.array(
		z.object({
			id: z.string().uuid(),
			name: z.string(),
			ollamaCredentialsId: z.string().uuid(),
		})
	).nullable(),
});

// Zod schema for OllamaModels model
export const OllamaModelsSchema = z.object({
	id: z.string().uuid().nullable(),
	name: z.string(),
	ollamaCredentialsId: z.string().uuid(),
});

// Get credentials data from the database
export async function getCredentials() {
	const credentials = await database.ollamaCredentials.findMany({
		select: {
			id: true,
			token: true,
			endpointUrl: true,
			ollamaModels: true,
		},
	});
	const updatedCredentials = credentials.map(creds => {
		return {
			...creds,
			ollamaModels: creds.ollamaModels.map(model => {
				return {
					...model,
					toggle: false, // Initial toggle value is false
				};
			}),
		};
	});
	return updatedCredentials;
}

// Server side props with authentication
export const getServerSideProps: GetServerSideProps = withAuth(
	async (context, user) => {
		const credentials = await getCredentials();
		// credentials.ollamaModels.append(getOllamaModels());
		return {
			props: {
				credentials, // Pass the credentials data as a prop to your page
			},
		};
	});

// The main component for the form


// Page component
export default function OllamaConfigPage({ credentials }: { credentials: OllamaCredentials[] }) {
	return (
		<div className="bg-gray-50">
			<center>
				<div>
					<OllamaConfigForm credentials={credentials} />
				</div>
			</center>
		</div>
	);
}
