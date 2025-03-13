import { authProcedure, isCourseAuthorProcedure, t } from "../trpc";
import * as z from "zod";
import {database} from "@self-learning/database";
import {OllamaModelsSchema} from "../../../../../../../apps/site/pages/admin/test";
import {OllamaCredentialsSchema} from "../../../../../../../apps/site/pages/admin/test";

export const ollamaConfigRouter = t.router({
	addCredentials: t.procedure.input(OllamaCredentialsSchema).mutation(async ({ input, ctx }) => {
		if (ctx.user?.role === "ADMIN"){
			const created = await database.ollamaCredentials.create({
				data: {
					token: input.token,
					endpointUrl: input.endpointUrl,
					// Correctly handle the relationship (assuming you want to link existing OllamaModels)
					ollamaModels: {
						create: input.ollamaModels?.map((model) => ({
							name: model.name, // Assuming 'name' exists in your input for each model
							ollamaCredentialsId: input.id, // Linking to the current OllamaCredentials record
						})),
					},
				},
			});
			return created;
		}
		return null;
	}),
	addModel: t.procedure.input(OllamaModelsSchema).mutation(async ({ input, ctx }) => {
		if (ctx.user?.role === "ADMIN") {
			const created = await database.ollamaModels.create({
				data: {
					name: input.name,
					ollamaCredentialsId: input.ollamaCredentialsId,
				},
			});

			return created;
		} else {
		return null
		}
	}),
});
