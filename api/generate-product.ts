import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pollKieTask } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, style } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "KIE_API_KEY not configured" });
    }

    const finalPrompt = `Create a professional product shot or packaging layout of: ${prompt}.
Style: ${style || "isolated on a pristine, crisp, solid white studio background, flat front-on angle, professional commercial photography, ultra high detail, clean branding layout"}.
Important: Make the design bold, distinct, and clear so it can be extracted and placed on other products. No shadows cutting off the label, and no hands holding the product.`;

    const payload = {
      model: "z-image",
      input: {
        prompt: finalPrompt,
        aspect_ratio: "1:1",
      },
    };

    const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Kie AI API failed (status ${response.status}): ${errText}`);
    }

    const result = await response.json();
    const taskId = result.data?.taskId;
    if (!taskId) {
      throw new Error("No taskId returned from Kie AI.");
    }

    const imageResult = await pollKieTask(apiKey, taskId, "z-image");
    res.json(imageResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate product" });
  }
}
