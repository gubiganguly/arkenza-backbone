import OpenAI from "openai";
import { NextResponse } from "next/server";
import { userModel } from "@/lib/firebase/users/userModel";
import * as fs from 'fs';
import * as path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 30; 

// Configuration
const SAFE_WORDS_COUNT = 10000; // Configurable number of frequent words that are always allowed
let frequentWords: Map<string, number> = new Map();
let safeWords: Set<string> = new Set();

// Load and process the word frequency list
const initializeWordLists = () => {
  const wordListPath = path.join(process.cwd(), 'app/utils/corrected_word_frequency_english.txt');
  const fileContent = fs.readFileSync(wordListPath, 'utf-8');
  
  // Parse the word frequency file
  const words = fileContent.split('\n')
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length === 2)
    .map(([word, freq]) => ({ word: word.toLowerCase(), freq: parseFloat(freq) }));

  // Store all words and their frequencies
  words.forEach(({ word, freq }) => frequentWords.set(word, freq));

  // Store the safe words (top N most frequent words)
  safeWords = new Set(words.slice(0, SAFE_WORDS_COUNT).map(({ word }) => word));
}

// Initialize word lists when the API route is first loaded
initializeWordLists();

const checkForProhibitedWords = (
  text: string,
  usedNonFrequentWords: string[],
  problemWords: string[]
): { isValid: boolean; newWords: string[] } => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const newNonFrequentWords: string[] = [];
  
  for (const word of words) {
    // Skip if it's a safe word
    if (safeWords.has(word)) continue;

    // Check if it's a problem word
    if (problemWords.includes(word)) {
      return { isValid: false, newWords: [] };
    }

    // Check if it's a previously used non-frequent word
    if (usedNonFrequentWords.includes(word)) {
      return { isValid: false, newWords: [] };
    }

    // If it's a new non-frequent word, add it to the list
    if (frequentWords.has(word)) {
      newNonFrequentWords.push(word);
    }
  }

  return { isValid: true, newWords: newNonFrequentWords };
}

const generateText = async (
  openai: OpenAI,
  topic: string,
  subInterests: string[],
  problemWords: string[],
  storyTellerMode: string,
  usedNonFrequentWords: string[]
): Promise<{ text: string; newWords: string[] }> => {
  const proseModifier = {
    casual: "Please ensure the output is readable at a 5th grade level and is accessible to a general audience.",
    standard: "Please ensure the output is readable at a 9th grade level. Make this appeal to young adults.",
    academic: "Please ensure the output is written in an academic style.",
  }[storyTellerMode];

  const sys_prompt = `You are a highly skilled writer tasked with creating exactly 20 sentences about a given topic.
${proseModifier}
Please avoid using any complex or unusual words beyond common everyday language.
Do not use the following words: ${[...problemWords, ...usedNonFrequentWords].join(', ')}
Respond immediately with the text after receiving the topic.`;

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: sys_prompt },
      {
        role: "user",
        content: subInterests.length > 0
          ? `Write about: ${topic} with themes related to ${subInterests.join(", ")}`
          : `Write about: ${topic}`,
      },
    ],
    model: "gpt-4",
    temperature: 0.7,
  });

  const generatedText = chatCompletion.choices[0].message.content || '';
  const validation = checkForProhibitedWords(generatedText, usedNonFrequentWords, problemWords);

  if (!validation.isValid) {
    // Recursively try again if the text contains prohibited words
    return generateText(openai, topic, subInterests, problemWords, storyTellerMode, usedNonFrequentWords);
  }

  return { text: generatedText, newWords: validation.newWords };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interest = searchParams.get("interest");
    const subInterests = searchParams.get("subInterests")?.split(",") || [];
    const userId = searchParams.get("userId");
    const storyTellerMode = searchParams.get("storyTellerMode") || "casual";

    if (!interest || !userId) {
      return NextResponse.json(
        { error: "Please provide both interest and userId" },
        { status: 400 }
      );
    }

    // Get user data from Firebase
    const user = await userModel.getById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate text and get new used words
    const { text, newWords } = await generateText(
      openai,
      interest,
      subInterests,
      user.problemWords,
      storyTellerMode,
      user.usedNonFrequentWords || []
    );

    // Update user's used words in Firebase
    if (newWords.length > 0) {
      await userModel.update(userId, {
        usedNonFrequentWords: [...(user.usedNonFrequentWords || []), ...newWords]
      });
    }

    return NextResponse.json({ text, newWords }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}