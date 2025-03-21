import { authProcedure, t } from "../trpc";
import { z } from "zod";
import { chatWithLLM, getAvailableModelsOnEndpoint } from "@self-learning/api-client";

export const ollamaRouter = t.router({
	chat: authProcedure
		.input(
			z.object({
				message: z.string().min(1, "Message cannot be empty.")
			})
		)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				console.log("[ollamaRouter.chat] Unauthorized access attempt.");
				return { success: false, response: null };
			}

			try {
				const response = await chatWithLLM(input.message, "");

				if (!response) {
					console.error("[ollamaRouter.chat] Failed to get response from Ollama.");
					return { success: false, response: null };
				}

				return { success: true, response };
			} catch (error) {
				console.error("[ollamaRouter.chat] Error during chat processing:", error);
				return { success: false, response: null };
			}
		}),
	models: authProcedure
		.input(
			z.object({
				endpointUrl: z.string().url("Invalid URL format"),
				token: z.string().min(1, "Token cannot be empty.")
			})
		)
		.mutation(async ({ input }) => {
			try {
				const models = await getAvailableModelsOnEndpoint(input.endpointUrl, input.token);
				if (!models) {
					return { success: false, models: [] };
				}
				return { success: true, models };
			} catch (error) {
				console.error("[ollamaRouter.models] Error fetching models:", error);
				return { success: false, models: [] };
			}
		})
});
