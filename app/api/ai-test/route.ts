import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

export async function GET() {
  const vertex = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT || "worldschool-mvp",
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  });

  const model = vertex.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: "Reply with the single word: OK" }],
      },
    ],
  });

  const text =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text ??
    "NO_RESPONSE";

  return NextResponse.json({ text });
}

