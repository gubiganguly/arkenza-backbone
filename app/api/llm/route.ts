import OpenAI from "openai";
import { NextResponse } from "next/server";
import { userModel } from "@/lib/firebase/users/userModel";

// Set the runtime to nodejs since we're using OpenAI's SDK
export const runtime = 'nodejs';
// Set maximum execution time to 30 seconds
export const maxDuration = 30;

// Maximum number of retries if problem words are found
const MAX_RETRIES = 1;

/**
 * Extracts unique words from a text string
 * @param text - The text to extract words from
 * @returns Set of unique words in lowercase
 */
const extractUniqueWords = (text: string): Set<string> => {
  // Match words using word boundaries, convert to lowercase
  const words = text.match(/\b\w+\b/g) || [];
  return new Set(words.map(word => word.toLowerCase()));
};

/**
 * Finds new unique words that user hasn't seen before
 * @param text - The generated text
 * @param existingWords - Array of words user has already seen
 * @returns Array of new unique words
 */
const findNewUniqueWords = (text: string, existingWords: string[]): string[] => {
  const textWords = extractUniqueWords(text);
  const existingWordsSet = new Set(existingWords.map(word => word.toLowerCase()));
  
  return Array.from(textWords).filter(word => !existingWordsSet.has(word));
};

/**
 * Checks if the generated text contains any problem words
 * @param text - The generated text to check
 * @param problemWords - Array of words that should not appear in the text
 * @returns boolean indicating if any problem words were found
 */
const containsProblemWords = (text: string, problemWords: string[]): boolean => {
  // Convert text to lowercase
  const lowerText = text.toLowerCase();
  
  // Check if any problem word exists in the text using word boundaries
  return problemWords.some(problemWord => {
    const regex = new RegExp(`\\b${problemWord.toLowerCase()}\\b`, 'i');
    return regex.test(lowerText);
  });
}

/**
 * Generates text content using OpenAI's GPT-4 model based on given parameters
 * @param openai - OpenAI client instance
 * @param topic - Main topic/interest to write about
 * @param subInterests - Array of related sub-interests to incorporate
 * @param problemWords - Array of words that should not appear in the text
 * @param hideProblemWords - Whether to avoid using problem words
 * @param emphasizeProblemWords - Whether to intentionally include problem words
 * @returns Generated text content or error message
 */
const generateText = async (
  openai: OpenAI,
  topic: string,
  subInterests: string[],
  problemWords: string[],
  hideProblemWords: boolean,
  emphasizeProblemWords: boolean
): Promise<string> => {
  let attempts = 0;

  while (attempts <= MAX_RETRIES) {
    // Create system prompt based on word usage preferences
    let systemPrompt = `You are a highly skilled writer tasked with creating exactly 20 sentences about a given topic.
Please ensure the output is readable at a general audience level.`;

    if (hideProblemWords) {
      systemPrompt += `\nIMPORTANT: You must NOT use any of these words in your response: ${problemWords.join(', ')}.
Use alternative words or rephrase sentences to avoid these prohibited words.`;
    } else if (emphasizeProblemWords && problemWords.length > 0) {
      systemPrompt += `\nIMPORTANT: Try to naturally incorporate some of these words in your response: ${problemWords.join(', ')}.
Don't force all words, but aim to use at least a few of them where they fit naturally.`;
    }

    systemPrompt += '\nRespond immediately with the text after receiving the topic.';

    // Generate content using OpenAI's chat completion
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
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

    // Only verify no problem words are present if hideProblemWords is true
    if (!hideProblemWords || !containsProblemWords(generatedText, problemWords)) {
      return generatedText;
    }

    attempts++;
  }

  return "Not able to generate a passage with the selected problem words";
}

/**
 * Counts the number of words in a text
 * @param text - The text to count words in
 * @returns number of words
 */
const countWords = (text: string): number => {
  // Match words using word boundaries, excluding empty strings
  const words = text.match(/\b\w+\b/g) || [];
  return words.length;
};

/**
 * POST endpoint handler for text generation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      interest, 
      subInterests, 
      userId, 
      problemWords = [], 
      hideProblemWords = false,
      emphasizeProblemWords = false 
    } = body;

    // Validate required parameters
    if (!interest || !userId) {
      return NextResponse.json(
        { error: "Please provide both interest and userId" },
        { status: 400 }
      );
    }

    // Validate conflicting settings
    if (hideProblemWords && emphasizeProblemWords) {
      return NextResponse.json(
        { error: "Cannot both hide and emphasize problem words" },
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

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate text content
    const text = await generateText(
      openai,
      interest,
      subInterests,
      problemWords,
      hideProblemWords,
      emphasizeProblemWords
    );

    // Only process unique words if text generation was successful
    let newUniqueWords: string[] = [];
    let totalWordCount = 0;
    
    if (text !== "Not able to generate a passage with the selected problem words") {
      totalWordCount = countWords(text);
      newUniqueWords = findNewUniqueWords(text, user.uniqueWordsEncountered || []);
      
      if (newUniqueWords.length > 0) {
        await userModel.update(userId, {
          uniqueWordsEncountered: [...(user.uniqueWordsEncountered || []), ...newUniqueWords]
        });
      }
    }

    return NextResponse.json({ 
      text,
      totalWordCount,
      newUniqueWords,
      newUniqueWordCount: newUniqueWords.length,
      success: text !== "Not able to generate a passage with the selected problem words"
    }, { status: 200 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 