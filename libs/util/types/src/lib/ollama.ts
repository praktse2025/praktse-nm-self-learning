import { z } from "zod";

// Zod schemas
export const OllamaCredentialsSchema = z.object({
	id: z.string().uuid().nullable(),
	name: z.string(),
	token: z.string(),
	endpointUrl: z.string().url(),
	ollamaModels: z
		.array(
			z.object({
				id: z.string().uuid(),
				name: z.string(),
				ollamaCredentialsId: z.string().uuid()
			})
		)
		.nullable()
});

export const OllamaCredentialsFormSchema = z.object({
	name: z.string(),
	token: z.string(),
	endpointUrl: z.string().url(),
})

// Zod schema for OllamaModels model
export const OllamaModelsSchema = z.object({
	id: z.string().uuid().nullable(),
	name: z.string(),
	ollamaCredentialsId: z.string().uuid()
});
