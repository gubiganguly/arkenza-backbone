import { readFileSync } from 'fs';
import path from 'path';

// Create a Map to cache the frequencies
let wordFrequencyMap: Map<string, number> | null = null;

export function initializeWordFrequencyMap() {
  if (wordFrequencyMap) return wordFrequencyMap;

  wordFrequencyMap = new Map();
  const filePath = path.join(process.cwd(), 'app/utils/corrected_word_frequency_english.txt');
  const fileContent = readFileSync(filePath, 'utf-8');
  
  fileContent.split('\n').forEach(line => {
    const [word, frequency] = line.trim().split(/\s+/);
    if (word && frequency) {
      wordFrequencyMap!.set(word.toLowerCase(), parseFloat(frequency));
    }
  });

  return wordFrequencyMap;
}

export function getWordFrequency(word: string): number {
  const map = initializeWordFrequencyMap();
  return map.get(word.toLowerCase()) || 0; 
} 