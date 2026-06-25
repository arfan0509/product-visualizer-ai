import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pollKieTask, uploadToTmpFiles } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, medium, prompt } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Product image is required" });
    }
    if (!medium) {
      return res.status(400).json({ error: "Medium is required" });
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "KIE_API_KEY not configured" });
    }

    const match = image.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    const mimeType = match?.[1] || "image/png";
    const base64Data = match?.[2] || image;

    const imageUrl = await uploadToTmpFiles(base64Data, mimeType);

    const promptText = `Create a realistic product mockup: place the provided image EXACTLY as-is onto a ${medium}. The design/artwork from the input image must be preserved with 100% fidelity — do not redraw, reinterpret, simplify, or alter the image in any way. The original colors, shapes, proportions, and every detail must remain identical. Only adjust perspective and curvature to match the ${medium} surface naturally.

Scene: ${prompt || "clean studio photography, professional product mockup, soft natural lighting, subtle shadows"}.`;

    const payload = {
      model: "gpt-image-2-image-to-image",
      input: {
        prompt: promptText,
        input_urls: [imageUrl],
        aspect_ratio: "auto",
        resolution: "1K",
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

    const imageResult = await pollKieTask(apiKey, taskId, "gpt-image-2");
    res.json(imageResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to visualize product mockup" });
  }
}
