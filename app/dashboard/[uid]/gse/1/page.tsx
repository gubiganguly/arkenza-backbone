"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GSELayout } from "@/components/gse-layout";
import TextHighlighter from "@/app/components/text-highlighter/TextHighlighter";
import { userModel } from "@/lib/firebase/users/userModel";
import { User, ProblemWord } from "@/lib/firebase/users/userSchema";
import { useRouter } from "next/navigation";
import { RefreshCw, BookOpen, Mic, Brain, ArrowRight, Heart, Scale, Info, Play, Pause, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideDeckModal } from "@/components/slide-deck-modal";

const HELP_TEXT = `Please take some time to recite a few passages and identify words that you may have trouble pronouncing. You can generate new passages and select words in that passage to take note of which words are causing you problems. Once you are done, click the Finish button to save your problem words.`;

const INTRO_TEXT = `In this exercise, you'll practice reciting passages out loud while identifying words that are challenging to pronounce. This will help improve your pronunciation skills and build confidence in speaking English.`;

const EXERCISE_STEPS = [
  "Make sure you are in a place where no one can hear you",
  "Choose topics you would like to recite and generate the text passages", 
  "Recite the text passages aloud",
  "If you hear anyone approaching, stop speaking until they are gone",
  "Add any newly discovered problematic words to your list",
  "When ready, click the 'next' button to proceed"
];

const TOOL_DESCRIPTIONS = {
  reading: "Practice reciting passages aloud to improve pronunciation",
  speaking: "Focus on clear speech and proper word pronunciation",
  learning: "Learn and track challenging words to enhance vocabulary"
};

const INTRO_SLIDES = [
  {
    title: "Welcome to GSE 1",
    content: "Welcome to your first Graduated Speaking Exercise (GSE)! This is the beginning of your journey to improved fluency. In this GSE, you will recite text passages in complete privacy, with absolutely no monitoring or recording. This is your safe space to practice.",
    icon: <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
  },
  {
    title: "Complete Privacy Guaranteed",
    content: "You will recite these passages when you are completely alone. Nobody is listening - not even your computer. For maximum privacy, you can even print out the text passages and turn off your computer before reciting them. This exercise is designed to be completely private, with no recording or monitoring of any kind.",
    icon: <Mic className="h-8 w-8 text-blue-600 dark:text-blue-400" />
  },
  {
    title: "AI-Powered Practice",
    content: "The text passages are written by artificial intelligence (ChatGPT), customized to your interests. Simply choose the topics you'd like to recite about, and ChatGPT will generate personalized passages. What's more impressive is that it will automatically avoid using any words you've identified as problematic, making your practice more effective and comfortable.",
    icon: <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
  },
  {
    title: "Future Progression",
    content: "While later exercises will include speech fluency measurements to help guide your progress, this first GSE is completely monitoring-free. We want you to start this journey in a conversation where nothing, not even silicon, is listening to or processing your speech. This creates the most comfortable environment for practice.",
    icon: <Heart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
  },
  {
    title: "Self-Assessment Matters",
    content: "Remember, experiencing a few disfluencies while reciting doesn't automatically mean you should judge yourself as 'disfluent'. What truly matters is how YOU feel about your speech and fluency. You might have some disfluencies but feel perfectly fluent - that's fine to move forward. Or you might speak perfectly but feel unsure - that's a sign to spend more time here. Trust your judgment.",
    icon: <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
  }
];

const FINAL_SLIDE = {
  title: "GSE 1: Recite Aloud",
  description: "Practice reciting passages out loud while identifying words that are challenging to pronounce. This will help improve your pronunciation skills and build confidence in speaking English.",
  duration: "120-240",
  deviceSettings: [
    {
      column1: [
        { label: "My Mic", enabled: false },
        { label: "Text to Speech", enabled: true },
        { label: "AI Generated Text", enabled: true }
      ],
      column2: [
        { label: "Video Camera", enabled: false },
        { label: "Fluency Monitor", enabled: false },
        { label: "Virtual Reality", enabled: false }
      ]
    }
  ],
  tools: [
    {
      icon: <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      label: "Reciting",
      description: "Practice with AI-generated passages tailored to your interests"
    },
    {
      icon: <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      label: "Privacy",
      description: "Complete privacy with no recording or monitoring of any kind"
    },
    {
      icon: <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      label: "Progress",
      description: "Self-paced practice with the ability to track challenging words"
    }
  ],
  speechHearingSettings: [
    { label: "STT", enabled: false, tooltip: "Speech To Text" },
    { label: "FM", enabled: false, tooltip: "Fluency Monitor" },
    { label: "chatGPT", enabled: false },
    { label: "Human", enabled: false },
    { label: "fluencyAI", enabled: false },
    { label: "Zoom", enabled: false }
  ]
};

// Update the GenerateTextResponse interface
interface GenerateTextResponse {
  text: string;
  totalWordCount: number;
  newUniqueWords: string[];
  newUniqueWordCount: number;
  success: boolean;
  problematicWords?: string[];
  generationTimeMs: number;
  startTime: string;
}

// Add helper function to format time
const formatGenerationTime = (ms: number): string => {
  return `${(ms / 1000).toFixed(2)}s`;
};

// Add these utility functions near the top with other helper functions
const isProblemWordDuplicate = (words: ProblemWord[], newWord: string): boolean => {
  return words.some(pw => pw.word.toLowerCase() === newWord.toLowerCase());
};

export default function GSE1Page({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [generatedText, setGeneratedText] = useState<string>("Click generate to create a new passage.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(true);

  // Update state to use ProblemWord interface
  const [problemWords, setProblemWords] = useState<ProblemWord[]>([]);
  const [totalWordCount, setTotalWordCount] = useState<number>(0);
  const [newUniqueWords, setNewUniqueWords] = useState<string[]>([]);

  // Add state for generation data
  const [generationData, setGenerationData] = useState<GenerateTextResponse | null>(null);

  // Add state for passage timing
  const [passageStartTime, setPassageStartTime] = useState<string | null>(null);

  // Add these new state variables for topic rotation
  const [currentTopicIndex, setCurrentTopicIndex] = useState<number>(0);
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState<number>(0);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [currentSubtopic, setCurrentSubtopic] = useState<string>("");

  // Add state to track what was used for the current passage
  const [displayedTopic, setDisplayedTopic] = useState<string>("");
  const [displayedSubtopic, setDisplayedSubtopic] = useState<string>("");

  // Add temperature control state
  const [temperature, setTemperature] = useState<number>(0.7); // Default to 0.7

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add a loading state for TTS
  const [isTTSLoading, setIsTTSLoading] = useState(false);

  // Add state for pre-generated audio
  const [preGeneratedAudioUrl, setPreGeneratedAudioUrl] = useState<string | null>(null);

  // Add state to track if audio is paused
  const [isPaused, setIsPaused] = useState(false);

  // Add state for playback speed
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await userModel.getById(params.uid);
      if (userData) {
        setUser(userData);
        setProblemWords(userData.problemWords);
      }
    };

    loadUser();
  }, [params.uid]);

  useEffect(() => {
    if (user?.interests && user.interests.length > 0) {
      // Initialize with the first topic and subtopic
      const firstTopic = user.interests[0];
      setCurrentTopicIndex(0);
      setCurrentSubtopicIndex(0);
      setCurrentTopic(firstTopic.name);
      
      if (firstTopic.subInterests && firstTopic.subInterests.length > 0) {
        setCurrentSubtopic(firstTopic.subInterests[0]);
      } else {
        setCurrentSubtopic("General");
      }
    }
  }, [user?.interests]);

  // Load saved temperature from localStorage
  useEffect(() => {
    const savedTemp = localStorage.getItem('llm-temperature');
    if (savedTemp) {
      setTemperature(Number(savedTemp));
    }
    
    const savedSpeed = localStorage.getItem('tts-playback-speed');
    if (savedSpeed) {
      setPlaybackSpeed(Number(savedSpeed));
    }
  }, []);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preGeneratedAudioUrl) {
        URL.revokeObjectURL(preGeneratedAudioUrl);
      }
    };
  }, [preGeneratedAudioUrl]);

  // Add this function to advance to the next topic/subtopic
  const advanceToNextTopic = () => {
    if (!user?.interests || user.interests.length === 0) return;
    
    console.log('=== Advancing Topic ===');
    console.log('Before - Topic Index:', currentTopicIndex, 'Subtopic Index:', currentSubtopicIndex);
    console.log('Before - Topic:', currentTopic, 'Subtopic:', currentSubtopic);
    
    const currentTopicObj = user.interests[currentTopicIndex];
    const hasSubtopics = currentTopicObj.subInterests && currentTopicObj.subInterests.length > 0;
    
    // If we have subtopics and haven't gone through all of them yet
    if (hasSubtopics && currentSubtopicIndex < currentTopicObj.subInterests.length - 1) {
      // Move to next subtopic
      const nextSubtopicIndex = currentSubtopicIndex + 1;
      console.log('Moving to next subtopic:', nextSubtopicIndex, currentTopicObj.subInterests[nextSubtopicIndex]);
      setCurrentSubtopicIndex(nextSubtopicIndex);
      setCurrentSubtopic(currentTopicObj.subInterests[nextSubtopicIndex]);
    } else {
      // Move to next topic
      const nextTopicIndex = (currentTopicIndex + 1) % user.interests.length;
      setCurrentTopicIndex(nextTopicIndex);
      setCurrentSubtopicIndex(0);
      
      const nextTopic = user.interests[nextTopicIndex];
      console.log('Moving to next topic:', nextTopicIndex, nextTopic.name);
      setCurrentTopic(nextTopic.name);
      
      if (nextTopic.subInterests && nextTopic.subInterests.length > 0) {
        console.log('Setting first subtopic:', nextTopic.subInterests[0]);
        setCurrentSubtopic(nextTopic.subInterests[0]);
      } else {
        console.log('Setting subtopic to General');
        setCurrentSubtopic("General");
      }
    }
  };

  // Update addBadWord function to prevent duplicates
  const addBadWord = async (word: string) => {
    // Normalize the word to lowercase for comparison
    const normalizedWord = word.toLowerCase();
    
    // Check if word already exists (case-insensitive)
    if (!isProblemWordDuplicate(problemWords, normalizedWord)) {
      try {
        const response = await fetch('/api/word-frequency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ word: normalizedWord })
        });

        if (!response.ok) throw new Error('Failed to get word frequency');
        
        const { frequency } = await response.json();
        
        // Add the word with its original case but compare in lowercase
        setProblemWords(prev => [...prev, { word, frequency }]);
      } catch (error) {
        console.error('Error getting word frequency:', error);
        // Add word with 0 frequency if lookup fails
        setProblemWords(prev => [...prev, { word, frequency: 0 }]);
      }
    }
  };

  // Update removeBadWord function to handle case-insensitive removal
  const removeBadWord = (word: string) => {
    setProblemWords(prev => 
      prev.filter(pw => pw.word.toLowerCase() !== word.toLowerCase())
    );
  };

  // Add function to save problem words
  const saveUserProblemWords = async () => {
    if (!user || !problemWords) return;
    
    try {
      await userModel.update(params.uid, {
        problemWords: problemWords
      });
    } catch (error) {
      console.error('Error saving problem words:', error);
    }
  };

  // Add function to pre-generate TTS
  const generateTTSAudio = async (text: string) => {
    try {
      setIsTTSLoading(true);
      
      // Limit text length to prevent quota issues
      const maxChars = 2000; // Conservative limit
      const textToSynthesize = text.length > maxChars ? 
        text.substring(0, maxChars) + "..." : 
        text;
      
      const response = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToSynthesize
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('TTS API error:', errorData);
        
        // Better error handling for quota exceeded
        if (errorData.details && errorData.details.includes("quota_exceeded")) {
          throw new Error('ElevenLabs rate limit reached. Please try again in a few minutes.');
        } else if (errorData.status === 401 || errorData.status === 403) {
          throw new Error('API key authentication failed. Please check your ElevenLabs API key.');
        } else if (errorData.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Failed to generate speech: ${errorData.error || 'Unknown error'}`);
        }
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Clean up old audio URL to prevent memory leaks
      if (preGeneratedAudioUrl) {
        URL.revokeObjectURL(preGeneratedAudioUrl);
      }
      
      setPreGeneratedAudioUrl(audioUrl);
      // Reset paused state when new audio is generated
      setIsPaused(false);
    } catch (error) {
      console.error('Error pre-generating TTS:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate speech. Please try again.');
    } finally {
      setIsTTSLoading(false);
    }
  };

  // Modify the generateNewPassage function to use current topic/subtopic
  const generateNewPassage = async () => {
    if (!currentTopic) {
      setError("No topics available");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      // Reset audio states when generating new passage
      setIsPlaying(false);
      setIsPaused(false);

      // Store the current topic/subtopic that will be used for this generation
      const topicForGeneration = currentTopic;
      const subtopicForGeneration = currentSubtopic;
      
      // Debug logging to help identify the issue
      console.log('=== GSE 1 Generation Debug ===');
      console.log('Current Topic Index:', currentTopicIndex);
      console.log('Current Subtopic Index:', currentSubtopicIndex);
      console.log('Current Topic:', currentTopic);
      console.log('Current Subtopic:', currentSubtopic);
      console.log('Topic for Generation:', topicForGeneration);
      console.log('Subtopic for Generation:', subtopicForGeneration);
      console.log('Displayed Topic:', displayedTopic);
      console.log('Displayed Subtopic:', displayedSubtopic);

      // Save current problem words before generating new passage
      await saveUserProblemWords();

      // If there's an existing passage, send timing data before generating new one
      if (passageStartTime) {
        await fetch('/api/passage-timing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: params.uid,
            startTime: passageStartTime,
            endTime: new Date().toISOString()
          })
        });
      }

      // Generate new passage with stored topic and subtopic
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interest: topicForGeneration,
          subInterests: subtopicForGeneration !== "General" ? [subtopicForGeneration] : [],
          userId: params.uid,
          problemWords,
          hideProblemWords: true,
          emphasizeProblemWords: false,
          temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate text');
      }

      const data: GenerateTextResponse = await response.json();
      
      if (data.text === "Not able to generate a passage with the selected problem words") {
        const problemWordsMessage = data.problematicWords && data.problematicWords.length > 0
          ? `I am not able to generate a passage with these words: ${data.problematicWords.map(word => `**${word}**`).join(', ')}. Try removing some of these words or regenerating the passage.`
          : '';
        
        setError(
          `Could not generate text avoiding all problem words. ${problemWordsMessage}`
        );
        return;
      }

      // Update state with new text and statistics
      setGeneratedText(data.text);
      setTotalWordCount(data.totalWordCount);
      setNewUniqueWords(data.newUniqueWords);
      setGenerationData(data);
      
      // Update local user state with new unique words
      if (data.newUniqueWords.length > 0 && user) {
        const updatedUniqueWords = [...(user.uniqueWordsEncountered || []), ...data.newUniqueWords];
        setUser(prev => prev ? {
          ...prev,
          uniqueWordsEncountered: updatedUniqueWords
        } : null);
      }
      
      // Store new passage start time from API response
      setPassageStartTime(data.startTime);
      
      // Store temperature in localStorage
      localStorage.setItem('llm-temperature', temperature.toString());
      
      // Update displayed topic/subtopic to match what was generated
      setDisplayedTopic(topicForGeneration);
      setDisplayedSubtopic(subtopicForGeneration);
      console.log('Updated displayed topic/subtopic:', topicForGeneration, subtopicForGeneration);
      
      // Advance to the next topic/subtopic for the next generation
      advanceToNextTopic();
      
      // Note: State updates are async, so the logged values might not reflect the new state immediately
      console.log('After advance - Current Topic:', currentTopic, 'Current Subtopic:', currentSubtopic);

      // Generate audio for current text if not pre-generated
      if (data.text && data.text !== "Click generate to create a new passage.") {
        await generateTTSAudio(data.text);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
      console.error('Error generating text:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Save problem words before completing the module
      await saveUserProblemWords();

      const currentModuleId = 5; // GSE 1 module ID
      const nextModuleId = currentModuleId + 1;

      const updatedModules = user.modulesCompleted.map(module => {
        if (module.id === currentModuleId) {
          return { ...module, isCompleted: true };
        }
        if (module.id === nextModuleId) {
          return { ...module, isUnlocked: true };
        }
        return module;
      });

      await userModel.update(params.uid, {
        modulesCompleted: updatedModules
      });

      // Send timing data before finishing
      if (passageStartTime) {
        await fetch('/api/passage-timing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: params.uid,
            startTime: passageStartTime,
            endTime: new Date().toISOString()
          })
        });
      }

      router.push(`/dashboard/${params.uid}`);
    } catch (error) {
      console.error('Error updating module status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update the toggleTTS function to use pre-generated audio
  const toggleTTS = async () => {
    // If currently playing, pause it
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
      return;
    }
    
    // If paused, resume from current position
    if (isPaused && audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed; // Apply current speed
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }
    
    // If we have pre-generated audio, start from beginning
    if (preGeneratedAudioUrl && audioRef.current) {
      audioRef.current.src = preGeneratedAudioUrl;
      audioRef.current.playbackRate = playbackSpeed; // Apply current speed
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
    } else {
      // Generate audio for current text if not pre-generated
      if (generatedText && generatedText !== "Click generate to create a new passage.") {
        await generateTTSAudio(generatedText);
      }
    }
  };

  // Add function to handle playback speed changes
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    localStorage.setItem('tts-playback-speed', speed.toString());
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Add function to restart TTS from beginning
  const restartTTS = () => {
    if (preGeneratedAudioUrl && audioRef.current) {
      audioRef.current.src = preGeneratedAudioUrl;
      audioRef.current.currentTime = 0; // Ensure we start from the beginning
      audioRef.current.playbackRate = playbackSpeed; // Apply current speed
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Add temperature control component
  const temperatureControl = (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Creativity:</span>
      <input
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={temperature}
        onChange={(e) => {
          const value = Number(e.target.value);
          if (value >= 0 && value <= 1) {
            setTemperature(value);
          }
        }}
        className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
      />
    </div>
  );

  // Create the topic display component
  const topicAndGenerateSection = (
    <div className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Topic:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{displayedTopic || currentTopic}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtopic:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{displayedSubtopic || currentSubtopic}</span>
          </div>
        </div>
        
        <Button
          onClick={generateNewPassage}
          disabled={isGenerating || !currentTopic}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 w-full md:w-auto"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {isTTSLoading ? 'Preparing Audio...' : 'Generating...'}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Generate New Passage
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <GSELayout>
      <SlideDeckModal
        isOpen={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        slides={INTRO_SLIDES}
        finalSlide={FINAL_SLIDE}
      />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-950 dark:text-blue-100">GSE 1: Recite Aloud</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
          Practice reciting text with clear pronunciation
          <button
            onClick={() => setShowMoreInfo(!showMoreInfo)}
            className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm font-medium inline-flex items-center"
          >
            More Info
            {showMoreInfo ? (
              <ArrowRight className="h-4 w-4 ml-1 transform rotate-90 transition-transform" />
            ) : (
              <ArrowRight className="h-4 w-4 ml-1 transition-transform" />
            )}
          </button>
        </p>
        
        {showMoreInfo && (
          <div className="mt-4 max-w-2xl mx-auto animate-fadeIn">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-left">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">About This Exercise</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{INTRO_TEXT}</p>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">How it works:</h4>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                {EXERCISE_STEPS.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Tools Available:</h4>
                <ul className="space-y-2">
                  {Object.entries(TOOL_DESCRIPTIONS).map(([key, description]) => (
                    <li key={key} className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span className="text-gray-600 dark:text-gray-400">{description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <Card className="relative mb-8 p-8">
        <div className="prose mx-auto max-w-none">
          <div className="flex flex-col gap-6">
            {temperatureControl}
            {topicAndGenerateSection}
            
            {error && (
              <p 
                className="text-sm text-red-500 dark:text-red-400"
                dangerouslySetInnerHTML={{
                  __html: error.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                }}
              />
            )}

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={toggleTTS}
                    disabled={isTTSLoading || (!preGeneratedAudioUrl && generatedText === "Click generate to create a new passage.")}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    {isTTSLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Preparing Audio...
                      </>
                    ) : isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause Choral Reading
                      </>
                    ) : isPaused ? (
                      <>
                        <Play className="h-4 w-4" />
                        Continue Choral Reading
                      </>
                    ) : !preGeneratedAudioUrl ? (
                      <>
                        <Play className="h-4 w-4" />
                        {generatedText === "Click generate to create a new passage." ? "Generate passage first" : "Prepare Audio"}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Begin Choral Reading
                      </>
                    )}
                  </Button>
                  
                  {/* Start from Beginning button - only show when audio is available and playback has started */}
                  {preGeneratedAudioUrl && !isTTSLoading && (isPlaying || isPaused) && (
                    <Button
                      onClick={restartTTS}
                      className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Start from Beginning
                    </Button>
                  )}
                  
                  {preGeneratedAudioUrl && !isTTSLoading && (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      Audio Ready
                    </span>
                  )}
                </div>
                
                {/* Speed Control Slider */}
                {preGeneratedAudioUrl && !isTTSLoading && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[40px]">Speed:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={playbackSpeed}
                        onChange={(e) => handleSpeedChange(Number(e.target.value))}
                        className="flex-1 max-w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 
                                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 
                                   [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                                   [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
                                   [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                      />
                      <span className="text-sm text-blue-600 dark:text-blue-400 min-w-[30px]">{playbackSpeed.toFixed(1)}x</span>
                    </div>
                    <div className="flex items-center gap-2 ml-[44px]">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            Math.abs(playbackSpeed - speed) < 0.05
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <audio ref={audioRef} className="hidden" />
              </div>
              
              <TextHighlighter
                text={generatedText}
                highlightedWords={problemWords.map(pw => pw.word)}
                addBadWord={addBadWord}
                removeBadWord={removeBadWord}
              />

              {/* Word Statistics */}
              {totalWordCount > 0 && generationData && (
                <div className="flex items-center justify-end gap-6 text-sm mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Generation Time: </span>
                    <span className="text-blue-600 dark:text-blue-400">{formatGenerationTime(generationData.generationTimeMs)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Total Words: </span>
                    <span className="text-blue-600 dark:text-blue-400">{totalWordCount}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">New Unique Words: </span>
                    <span className="text-blue-600 dark:text-blue-400">{newUniqueWords.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Total Unique Words Encountered: </span>
                    <span className="text-blue-600 dark:text-blue-400">{user?.uniqueWordsEncountered?.length || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <Button
          onClick={handleFinish}
          disabled={isUpdating}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isUpdating ? (
            <span className="flex items-center">
              Updating...
            </span>
          ) : (
            <span className="flex items-center">
              Finish
            </span>
          )}
        </Button>
      </div>
    </GSELayout>
  );
}