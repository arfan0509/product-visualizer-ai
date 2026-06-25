import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const taskId = req.query.taskId as string;
  if (!taskId) {
    return res.status(400).json({ error: "taskId is required" });
  }

  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "KIE_API_KEY not configured" });
  }

  try {
    const statusResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { headers: { "Authorization": `Bearer ${apiKey}` } }
    );

    if (!statusResponse.ok) {
      return res.json({ status: "pending" });
    }

    const statusResult = await statusResponse.json();
    const data = statusResult.data;

    if (data?.state === "success") {
      const resultJson = typeof data.resultJson === "string" ? JSON.parse(data.resultJson) : data.resultJson;
      const outputUrl = resultJson?.resultUrls?.[0];
      if (!outputUrl) {
        return res.json({ status: "error", error: "No result URL found" });
      }

      const imageRes = await fetch(outputUrl);
      if (!imageRes.ok) {
        return res.json({ status: "error", error: "Failed to fetch result image" });
      }
      const buffer = await imageRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const contentType = imageRes.headers.get("content-type") || "image/png";

      return res.json({
        status: "success",
        image: `data:${contentType};base64,${base64}`,
      });
    } else if (data?.state === "fail") {
      return res.json({ status: "error", error: data.failMsg || "Generation failed" });
    }

    return res.json({ status: "pending" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
