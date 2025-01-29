import { useState } from "react";

type UseLLMResult = {
  generateText: (topic: string) => Promise<string>;
  isLoading: boolean;
  error: Error | null;
};

export function useLLM(): UseLLMResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateText = async (topic: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Stub response - in reality, this would be an API call to an LLM service
      const stubResponse = `Here is some generated text about ${topic}. 
        This is a placeholder response that would normally come from an LLM API.
        The actual implementation would make calls to services like OpenAI or Anthropic.`;

      return stubResponse;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to generate text")
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateText,
    isLoading,
    error,
  };
}
