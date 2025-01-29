import { SlideDeck } from "@/components/slide-deck";
import { introductionModule } from "@/app/introduction/introduction";

export default function IntroductionPage() {
  return <SlideDeck module={introductionModule} />;
}
