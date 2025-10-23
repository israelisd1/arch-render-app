/**
 * Serviço de integração com a Architecture Rendering API via RapidAPI
 */

interface RenderRequest {
  sceneType: "interior" | "exterior";
  outputFormat: "webp" | "jpg" | "png" | "avif";
  image: string; // URL ou base64
  prompt?: string;
  base64Response?: boolean;
}

interface RenderResponse {
  url?: string;
  base64?: string;
  error?: string;
}

/**
 * Chama a API de renderização arquitetônica
 */
export async function callArchitectureRenderingAPI(
  request: RenderRequest
): Promise<RenderResponse> {
  const apiKey = process.env.RAPIDAPI_KEY;
  
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  try {
    const response = await fetch(
      "https://architecture-rendering-api.p.rapidapi.com/render",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "architecture-rendering-api.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ArchitectureAPI] Error response:", errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[ArchitectureAPI] Request failed:", error);
    throw error;
  }
}

