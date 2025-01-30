import OpenAI from "openai";
import { NextResponse } from "next/server";

// Add timeout configuration
export const runtime = 'nodejs';
export const maxDuration = 30; // This sets the timeout to 30 seconds

const generateAbinito = async (
  topic: string,
  badWords: string[],
  storyTellerMode: string
) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Please set the OPENAI_API_KEY environment variable.");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const badWordsString = badWords.map((word) => `"${word}"`).join(", ");

  const proseModifier = {
    casual:
      "Please ensure the output is readable at a 5th grade level and is accessible to a general audience.",
    standard:
      "Please ensure the output is readable at a 9th grade level. Make this appeal to young adults.",
    academic: "Please ensure the output is written in an academic style.",
  }[storyTellerMode];

  let sys_prompt = `You are a highly skilled writer tasked with creating captivating pieces of text on a given topic.
You will be given a topic and you will respond ONLY with around 4 paragraphs of text about the topic.

${proseModifier}

The user will not be able to respond to your text, so do not attempt to make conversation at all. Respond immediately with the text after receiving the topic.
`;

  if (badWords.length > 0) {
    sys_prompt += `
The user struggles with pronouncing certain words, so you must completely avoid using the following words or any variations of them (including plurals, different tenses, or capitalizations): ${badWordsString}.

This is very important for the user's learning experience. Double-check your response to ensure none of these words appear.`;
  }

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: sys_prompt,
      },
      {
        role: "user",
        content: `Write about the topic: ${topic}`,
      },
    ],
    model: "gpt-4",
    temperature: 0.7,
  });

  return chatCompletion.choices[0].message.content;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interest = searchParams.get("interest");
    const badWordsRaw = searchParams.get("badWords");
    const storyTellerMode = searchParams.get("storyTellerMode");

    if (!interest) {
      return NextResponse.json(
        { error: "Please provide an interest" },
        { status: 400 }
      );
    }

    const badWords = badWordsRaw ? badWordsRaw.split(",") : [];

    const text = await generateAbinito(
      interest,
      badWords,
      storyTellerMode || "casual"
    );

    if (!text || !text.trim() || /^[\s*]+$/.test(text)) {
      return NextResponse.json(
        { error: "Generated text is invalid" },
        { status: 500 }
      );
    }

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
