import { redirect } from "next/navigation";

// First-run onboarding lives inside the app (welcome modal + setup checklist on Home, blueprint §8).
export default function OnboardingPage() { redirect("/home?welcome=1"); }
