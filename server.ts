import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function convertUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch output image from ${url}`);
  }
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${base64}`;
}

async function pollKieTask(apiKey: string, taskId: string, model: string): Promise<{ image: string; feedback: string }> {
  console.log(`Polling for taskId: ${taskId}`);
  const maxPolls = 40;
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const statusResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { headers: { "Authorization": `Bearer ${apiKey}` } }
    );

    if (!statusResponse.ok) {
      console.warn(`Poll failed for ${taskId} (status ${statusResponse.status})`);
      continue;
    }

    const statusResult = await statusResponse.json();
    const data = statusResult.data;
    console.log(`Poll #${i + 1}: state=${data?.state}, progress=${data?.progress}`);

    if (data?.state === "success") {
      const resultJson = typeof data.resultJson === "string" ? JSON.parse(data.resultJson) : data.resultJson;
      const outputUrl = resultJson?.resultUrls?.[0];
      if (!outputUrl) {
        throw new Error("Kie AI succeeded but no resultUrls found.");
      }
      console.log(`Kie AI completed! Image URL: ${outputUrl}`);
      const base64Uri = await convertUrlToBase64(outputUrl);
      return { image: base64Uri, feedback: `Generated successfully using Kie AI (${model})` };
    } else if (data?.state === "fail") {
      throw new Error(`Kie AI generation failed: ${data.failMsg || "Unknown error"}`);
    }
  }

  throw new Error("Kie AI generation timed out after 2 minutes.");
}

async function generateImageWithZImage(
  prompt: string,
  aspectRatio: string = "1:1"
): Promise<{ image: string; feedback: string }> {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error("KIE_API_KEY environment variable is not set.");
  }

  const payload = {
    model: "z-image",
    input: {
      prompt,
      aspect_ratio: aspectRatio,
    },
  };

  console.log(`Submitting to Kie AI. Model: z-image, Aspect: ${aspectRatio}`);

  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Kie AI API failed (status ${response.status}): ${errText}`);
  }

  const result = await response.json();
  console.log("Kie AI submit response:", JSON.stringify(result));

  const taskId = result.data?.taskId;
  if (!taskId) {
    throw new Error("No taskId returned from Kie AI.");
  }

  return pollKieTask(apiKey, taskId, "z-image");
}

async function uploadToTmpFiles(base64Data: string, mimeType: string): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const buffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([buffer], { type: mimeType });

  const formData = new FormData();
  formData.append("file", blob, `image.${ext}`);

  const response = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to tmpfiles.org (${response.status})`);
  }

  const result: any = await response.json();
  const url: string = result.data?.url || "";
  return url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
}

async function visualizeWithKie(
  prompt: string,
  imageDataUri: string
): Promise<{ image: string; feedback: string }> {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error("KIE_API_KEY environment variable is not set.");
  }

  const match = imageDataUri.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  const mimeType = match?.[1] || "image/png";
  const base64Data = match?.[2] || imageDataUri;

  console.log("Uploading image to tmpfiles.org...");
  const imageUrl = await uploadToTmpFiles(base64Data, mimeType);
  console.log(`Uploaded: ${imageUrl}`);

  const payload = {
    model: "gpt-image-2-image-to-image",
    input: {
      prompt,
      input_urls: [imageUrl],
      aspect_ratio: "auto",
      resolution: "1K",
    },
  };

  console.log("Submitting visualization to Kie AI (gpt-image-2)...");

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
  console.log("Kie AI submit response:", JSON.stringify(result));

  const taskId = result.data?.taskId;
  if (!taskId) {
    throw new Error("No taskId returned from Kie AI.");
  }

  return pollKieTask(apiKey, taskId, "gpt-image-2");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

  app.get("/api/config", (req, res) => {
    res.json({
      hasKie: !!process.env.KIE_API_KEY,
      hasKieVisualize: !!process.env.KIE_API_KEY,
    });
  });

  app.post("/api/generate-product", async (req, res) => {
    try {
      const { prompt, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const finalPrompt = `Create a professional product shot or packaging layout of: ${prompt}.
Style: ${style || "isolated on a pristine, crisp, solid white studio background, flat front-on angle, professional commercial photography, ultra high detail, clean branding layout"}.
Important: Make the design bold, distinct, and clear so it can be extracted and placed on other products. No shadows cutting off the label, and no hands holding the product.`;

      console.log("Generating product design via Kie AI (z-image)...");
      const result = await generateImageWithZImage(finalPrompt, "1:1");
      res.json(result);
    } catch (error: any) {
      console.error("Error in generate-product:", error);
      res.status(500).json({ error: error.message || "Failed to generate product" });
    }
  });

  app.post("/api/visualize", async (req, res) => {
    try {
      const { image, medium, prompt, aspectRatio } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Product image is required" });
      }
      if (!medium) {
        return res.status(400).json({ error: "Medium is required" });
      }

      const promptText = `Create a realistic product mockup: place the provided image EXACTLY as-is onto a ${medium}. The design/artwork from the input image must be preserved with 100% fidelity — do not redraw, reinterpret, simplify, or alter the image in any way. The original colors, shapes, proportions, and every detail must remain identical. Only adjust perspective and curvature to match the ${medium} surface naturally.

Scene: ${prompt || "clean studio photography, professional product mockup, soft natural lighting, subtle shadows"}.`;

      console.log("Generating visualization via Kie AI (gpt-image-2)...");
      const result = await visualizeWithKie(promptText, image);
      res.json(result);
    } catch (error: any) {
      console.error("Error in visualize:", error);
      res.status(500).json({ error: error.message || "Failed to visualize product mockup" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
