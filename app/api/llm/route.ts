import OpenAI from "openai";
import { NextResponse } from "next/server";
import { userModel } from "@/lib/firebase/users/userModel";
import { ProblemWord } from '@/lib/firebase/users/userSchema';

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
const containsProblemWords = (text: string, problemWords: ProblemWord[]): boolean => {
  const lowerText = text.toLowerCase();
  
  return problemWords.some(pw => {
    const regex = new RegExp(`\\b${pw.word.toLowerCase()}\\b`, 'i');
    return regex.test(lowerText);
  });
}

/**
 * Finds problematic words in a text
 * @param text - The text to find problematic words in
 * @param problemWords - Array of problem words
 * @returns Array of problematic words found in the text
 */
const findProblematicWords = (text: string, problemWords: ProblemWord[]): string[] => {
  const lowerText = text.toLowerCase();
  return problemWords
    .filter(pw => {
      const regex = new RegExp(`\\b${pw.word.toLowerCase()}\\b`, 'i');
      return regex.test(lowerText);
    })
    .map(pw => pw.word);
};

/**
 * Generates text content using OpenAI's GPT-4 model based on given parameters
 * @param openai - OpenAI client instance
 * @param topic - Main topic/interest to write about
 * @param subInterests - Array of related sub-interests to incorporate
 * @param problemWords - Array of words that should not appear in the text
 * @param hideProblemWords - Whether to avoid using problem words
 * @param emphasizeProblemWords - Whether to intentionally include problem words
 * @param temperature - The temperature for the OpenAI model
 * @returns Generated text content or error message
 */
const generateText = async (
  openai: OpenAI,
  topic: string,
  subInterests: string[],
  problemWords: ProblemWord[],
  hideProblemWords: boolean,
  emphasizeProblemWords: boolean,
  temperature: number
): Promise<{ text: string; problematicWords?: string[]; generationTimeMs: number }> => {
  let attempts = 0;
  let lastGeneratedText = '';
  const startTime = Date.now();

  while (attempts <= MAX_RETRIES) {
    // Create system prompt based on word usage preferences
    let systemPrompt = `You are a highly skilled writer tasked with creating exactly 20 sentences about a given topic.
Please ensure the output is readable at a general audience level.`;

    if (hideProblemWords) {
      systemPrompt += `\nIMPORTANT: You must NOT use any of these words in your response: ${problemWords.map(pw => pw.word).join(', ')}.
Use alternative words or rephrase sentences to avoid these prohibited words.`;
    } else if (emphasizeProblemWords && problemWords.length > 0) {
      systemPrompt += `\nIMPORTANT: Try to naturally incorporate some of these words in your response: ${problemWords.map(pw => pw.word).join(', ')}.
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
      temperature: temperature,
    });

    const generatedText = chatCompletion.choices[0].message.content || '';
    lastGeneratedText = generatedText; // Save the last generated text

    // Only verify no problem words are present if hideProblemWords is true
    if (!hideProblemWords || !containsProblemWords(generatedText, problemWords)) {
      return { 
        text: generatedText,
        generationTimeMs: Date.now() - startTime
      };
    }

    attempts++;
  }

  // If we failed to generate valid text, return the problematic words
  const foundProblematicWords = findProblematicWords(lastGeneratedText, problemWords);
  
  return { 
    text: "Not able to generate a passage with the selected problem words",
    problematicWords: foundProblematicWords,
    generationTimeMs: Date.now() - startTime
  };
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
      emphasizeProblemWords = false,
      temperature = 0.99
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

    const result = await generateText(
      openai,
      interest,
      subInterests,
      problemWords,
      hideProblemWords,
      emphasizeProblemWords,
      temperature
    );
    
    if (result.text === "Not able to generate a passage with the selected problem words") {
      // Update user's passage history
      await userModel.update(userId, {
        passageHistory: [...(user.passageHistory || []), {
          newUniqueWordCount: 0,
          generationTimeMs: result.generationTimeMs,
          success: false,
          startTime: new Date(),
          endTime: new Date(), // Same as startTime for failed generations
          timeSpentMs: 0,
          totalWordCount: 0
        }]
      });

      return NextResponse.json({ 
        text: result.text,
        problematicWords: result.problematicWords,
        generationTimeMs: result.generationTimeMs,
        success: false,
        startTime: new Date().toISOString() // Add timestamp for client
      }, { status: 200 });
    }

    // Process unique words if text generation was successful
    let newUniqueWords: string[] = [];
    let totalWordCount = 0;
    
    totalWordCount = countWords(result.text);
    newUniqueWords = findNewUniqueWords(result.text, user.uniqueWordsEncountered || []);
    
    // Update user data including passage history
    await userModel.update(userId, {
      uniqueWordsEncountered: [...(user.uniqueWordsEncountered || []), ...newUniqueWords],
      passageHistory: [...(user.passageHistory || []), {
        newUniqueWordCount: newUniqueWords.length,
        generationTimeMs: result.generationTimeMs,
        success: true,
        startTime: new Date(),
        endTime: new Date(), // Will be updated when user finishes
        timeSpentMs: 0, // Will be updated when user finishes
        totalWordCount: totalWordCount
      }]
    });

    return NextResponse.json({ 
      text: result.text,
      totalWordCount,
      newUniqueWords,
      newUniqueWordCount: newUniqueWords.length,
      generationTimeMs: result.generationTimeMs,
      success: true,
      startTime: new Date().toISOString() // Add timestamp for client
    }, { status: 200 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 