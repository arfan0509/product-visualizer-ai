export async function convertUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch output image from ${url}`);
  }
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${base64}`;
}

export async function pollKieTask(apiKey: string, taskId: string, model: string): Promise<{ image: string; feedback: string }> {
  const maxPolls = 40;
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const statusResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { headers: { "Authorization": `Bearer ${apiKey}` } }
    );

    if (!statusResponse.ok) continue;

    const statusResult = await statusResponse.json();
    const data = statusResult.data;

    if (data?.state === "success") {
      const resultJson = typeof data.resultJson === "string" ? JSON.parse(data.resultJson) : data.resultJson;
      const outputUrl = resultJson?.resultUrls?.[0];
      if (!outputUrl) {
        throw new Error("Kie AI succeeded but no resultUrls found.");
      }
      const base64Uri = await convertUrlToBase64(outputUrl);
      return { image: base64Uri, feedback: `Generated successfully using Kie AI (${model})` };
    } else if (data?.state === "fail") {
      throw new Error(`Kie AI generation failed: ${data.failMsg || "Unknown error"}`);
    }
  }

  throw new Error("Kie AI generation timed out after 2 minutes.");
}

export async function uploadToTmpFiles(base64Data: string, mimeType: string): Promise<string> {
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
