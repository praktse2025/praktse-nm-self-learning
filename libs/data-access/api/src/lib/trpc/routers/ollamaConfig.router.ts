import {authProcedure, t} from "../trpc";
import {database} from "@self-learning/database";
import {OllamaCredentialsSchema, OllamaModelsSchema} from "@self-learning/types";
import {z} from "zod";

export const ollamaConfigRouter = t.router({
	addCredentials: authProcedure
		.input(OllamaCredentialsSchema)
		.mutation(async ({input, ctx}) => {
			if (ctx.user?.role !== "ADMIN") {
				console.log("Unauthorized access attempt to add credentials.");
				return null;
			}

			try {
				return await database.ollamaCredentials.create({
					data: {
						token: input.token,
						name: input.name,
						endpointUrl: input.endpointUrl,
						ollamaModels: input.ollamaModels
							? {
								create: input.ollamaModels.map(model => ({
									name: model.name,
									ollamaCredentialsId: input.id
								}))
							}
							: undefined
					}
				});
			} catch (error) {
				console.error("Error adding Ollama credentials:", error);
				return null;
			}
		}),
	addModel: authProcedure.input(OllamaModelsSchema).mutation(async ({input, ctx}) => {
		if (ctx.user?.role !== "ADMIN") {
			console.log("Unauthorized access attempt to add a model.");
			return null;
		}

		try {
			await database.ollamaModels.deleteMany(); // Clearing existing models before adding a new one.

			return await database.ollamaModels.create({
				data: {
					name: input.name,
					ollamaCredentialsId: input.ollamaCredentialsId
				}
			});
		} catch (error) {
			console.error("Error adding Ollama model:", error);
			return null;
		}
	}),
	removeCredentials: authProcedure
		.input(z.object({id: z.string()}))
		.mutation(async ({input, ctx}) => {
			if (ctx.user?.role !== "ADMIN") {
				console.log("Unauthorized access attempt to remove credentials.");
				return null;
			}
			console.log(input.id);

			try {
				return await database.ollamaCredentials.delete({
					where: {id: input.id}
				});
			} catch (error) {
				console.error("Error removing Ollama credentials:", error);
				return null;
			}
		}),
});
