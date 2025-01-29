import OpenAI from "openai";
import { encoding_for_model } from "tiktoken";
import { NextResponse } from "next/server";

const getBadTokens = (badWords: string[], model = "gpt-4o") => {
  // @ts-expect-error - TikToken types are not up to date
  const enc = encoding_for_model(model);

  const captitalizeFirstLetter = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  const addSpace = (word: string) => ` ${word}`;

  let extendedBadWords = [...badWords, ...badWords.map(captitalizeFirstLetter)];
  extendedBadWords = [...extendedBadWords, ...extendedBadWords.map(addSpace)];

  const badTokens = extendedBadWords.map((word) => enc.encode(word)[0]);

  return [...new Set(badTokens)].filter((token) => token === 0 || !!token);
};

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
    sys_prompt += `The user struggles saying certain words so you must avoid using the following words: ${badWordsString}. `;
  }

  const prompt = `The topic is ${topic}.`;

  const badTokens = getBadTokens(badWords).slice(0, 300);
  const logitBias = badTokens.reduce(
    (acc: Record<number, number>, token: number) => {
      acc[token] = -100;
      return acc;
    },
    {}
  );

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: sys_prompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "gpt-4o",
    logit_bias: logitBias,
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
