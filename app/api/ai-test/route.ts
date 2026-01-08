import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

export async function GET() {
  try {
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
  } catch (error) {
    console.error("AI test error:", error);
    return NextResponse.json(
      {
        error: "Failed to connect to Google Cloud",
        message: error instanceof Error ? error.message : String(error),
        hint: "Make sure Google Cloud credentials are set up. See DEPLOYMENT.md for instructions.",
      },
      { status: 500 }
    );
  }
}

