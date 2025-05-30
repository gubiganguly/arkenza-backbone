import type { ModuleContent } from "@/types/slides"

export const introductionModule: ModuleContent = {
  id: "module1",
  title: "Introduction to Fluency",
  slides: [
    {
      id: 1,
      title: "Welcome to Arkenza",
      content: `# Welcome Video
      
<div style="display: flex; justify-content: center; margin-top: 2rem;">
  <video width="80%" controls autoPlay>
    <source src="/Welcome_Arkenza_01.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>`
    },
    {
      id: 2,
      title: "Welcome to Arkenza",
      content: `# Welcome to Arkenza
      
Start your journey to fluency with our proven methodology. This program is designed to help you achieve natural, confident speech in your target language.`,
    },
    {
      id: 3,
      title: "How It Works",
      content: `# How It Works

1. Complete each module at your own pace
2. Practice speaking exercises regularly
3. Track your progress over time
4. Unlock new content as you advance`,
    },
    {
      id: 4,
      title: "Getting Started",
      content: `# Getting Started

- Set aside regular practice time
- Find a quiet space to practice
- Stay consistent with your exercises
- Don't be afraid to make mistakes`,
    },
  ],
}