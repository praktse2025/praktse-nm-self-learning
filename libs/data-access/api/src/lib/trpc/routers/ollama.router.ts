import { authProcedure, t } from "../trpc";
import { chatWithOllama, getAvailableOllamaModels } from "data-access/ollama";
import { z } from "zod";

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
				const response = await chatWithOllama(input.message);

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
});
