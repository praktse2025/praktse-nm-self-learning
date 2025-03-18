import { database } from "@self-learning/database";

export async function chatWithOllama(message: string): Promise<string | null> {
	const payload = await getOllamaPayload();
	if (!payload) {
		console.error("Failed to retrieve Ollama payload.");
		return null;
	}

	try {
		const response = await fetch(payload.proxyUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${payload.token}`
			},
			body: JSON.stringify({
				prompt: message,
				model: payload.model,
				stream: false
			})
		});

		if (!response.ok) {
			console.log(`Ollama server responded with status: ${response.status}`);
			return null;
		}

		const jsonResponse = await response.json();
		if (!jsonResponse.response) {
			console.log("Ollama server returned an invalid response format.");
			return null;
		}

		return jsonResponse.response.trim();
	} catch (error) {
		console.log("Error communicating with Ollama server:", error);
		return null;
	}
}

async function getOllamaPayload() {
	try {
		const usedModel = await database.ollamaModels.findFirst({
			select: {
				name: true,
				ollamaCredentials: {
					select: {
						token: true,
						endpointUrl: true
					}
				}
			}
		});

		if (!usedModel || !usedModel.ollamaCredentials) {
			console.log("No valid Ollama model or credentials found in the database.");
			return null;
		}

		return {
			model: usedModel.name,
			token: usedModel.ollamaCredentials.token,
			proxyUrl: usedModel.ollamaCredentials.endpointUrl
		};
	} catch (error) {
		console.log("Error fetching Ollama model from the database:", error);
		return null;
	}
}

export async function getAvailableOllamaModels(): Promise<string[] | null> {
	const payload = await getOllamaPayload();
	if (!payload) {
		console.error("Failed to retrieve Ollama credentials.");
		return null;
	}

	try {
		const response = await fetch(`${payload.proxyUrl}/models`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${payload.token}`
			}
		});

		if (!response.ok) {
			console.log(`Failed to fetch models. Server responded with status: ${response.status}`);
			return null;
		}

		const jsonResponse = await response.json();
		if (!jsonResponse.models) {
			console.log("Invalid response format from Ollama server.");
			return null;
		}

		return jsonResponse.models;
	} catch (error) {
		console.log("Error fetching available Ollama models:", error);
		return null;
	}
}
