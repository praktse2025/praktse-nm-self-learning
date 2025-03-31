import {database} from "@self-learning/database";

async function getPayload() {
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
			console.log("No valid model or credentials found in the database.");
			return null;
		}

		return {
			model: usedModel.name,
			token: usedModel.ollamaCredentials.token,
			proxyUrl: usedModel.ollamaCredentials.endpointUrl
		};
	} catch (error) {
		console.log("Error fetching model from the database:", error);
		return null;
	}
}

export async function getAvailableModelsOnEndpoint(
	endpointURL: string,
	token: string
): Promise<string[] | null> {
	const apiUrl = `${endpointURL}/api/models`;

	try {
		const response = await fetch(apiUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			console.log(`Failed to fetch models. Status: ${response.status}`);
			return null;
		}

		const jsonResponse = await response.json();
		if (!jsonResponse.data || !Array.isArray(jsonResponse.data)) {
			console.log("Invalid response format from the server.");
			return null;
		}

		return jsonResponse.data.map((model: { id: string }) => model.id);
	} catch (error) {
		console.log("Error fetching available models:", error);
		return null;
	}
}

export async function chatWithLLM(message: string, systemPrompt: string): Promise<string | null> {
	const payload = await getPayload();
	if (!payload) {
		console.error("Failed to retrieve payload.");
		return null;
	}

	const apiUrl = `${payload.proxyUrl}/api/chat/completions`;

	try {
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${payload.token}`
			},
			body: JSON.stringify({
				model: payload.model,
				messages: [
					{role: "system", content: systemPrompt},
					{role: "user", content: message}
				],
				stream: false
			})
		});

		if (!response.ok) {
			console.log(`Server responded with status: ${response.status}`);
			return null;
		}

		const jsonResponse = await response.json();
		if (!jsonResponse.choices || !jsonResponse.choices[0]?.message?.content) {
			console.log("Server returned an unexpected response format.");
			return null;
		}

		return jsonResponse.choices[0].message.content.trim();
	} catch (error) {
		console.log("Error communicating with the server:", error);
		return null;
	}
}
