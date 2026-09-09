import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  SplitSquareHorizontal,
  Boxes,
  Search,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/app/components/header";
import { Footer } from "./components/footer";
import { SITE } from "@/app/site";
import { SCENARIOS } from "@/app/experiment/constants/scenarios";

const Arrow = () => (
  <div className="hidden lg:flex items-center justify-center">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="text-primary/30"
      aria-hidden
    >
      <path
        d="M0 12H22.5M22.5 12L16.5 6M22.5 12L16.5 18"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  </div>
);

const features = [
  {
    title: "Text Splitting",
    description:
      "Five legal sources get cut into chunks. Change the strategy and the chunk size and see where the cuts fall.",
    icon: <SplitSquareHorizontal className="h-6 w-6 text-primary" />,
    href: "/experiment?step=text-splitting",
  },
  {
    title: "Vector Embedding",
    description:
      "Each chunk is turned into a list of numbers. See the map of chunks that the search will run over.",
    icon: <Boxes className="h-6 w-6 text-primary" />,
    href: "/experiment?step=embedding",
  },
  {
    title: "Semantic Search",
    description:
      "Ask a question and see which chunks score highest, which sources they came from, and what the score does and does not measure.",
    icon: <Search className="h-6 w-6 text-primary" />,
    href: "/experiment?step=semantic-search",
  },
  {
    title: "Context Generation",
    description:
      "The top passages and your question go to a model. Read the hidden instructions, set the effort level, and check what the answer cites.",
    icon: <MessageSquare className="h-6 w-6 text-primary" />,
    href: "/experiment?step=generation",
  },
];

const FeatureCard = ({ feature }: { feature: (typeof features)[0] }) => (
  <Link
    href={feature.href}
    className="group relative block overflow-hidden rounded-2xl border bg-background h-[230px] p-6 transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    aria-label={`Open ${feature.title} step`}
  >
    <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
      {feature.icon}
    </div>
    <h2 className="mb-3 text-lg font-bold">{feature.title}</h2>
    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-4">
      {feature.description}
    </p>
  </Link>
);

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-28 pb-16">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50 dark:from-blue-950/30 dark:to-indigo-950/30" />
            <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          </div>
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                {SITE.name}
              </h1>
              <p className="mx-auto max-w-[760px] text-gray-500 dark:text-gray-400 md:text-xl">
                {SITE.tagline} Legal research tools split documents into
                chunks, retrieve the chunks closest to your question, and hand
                them to a model that writes the answer. Each step can go wrong
                in ways the final answer does not show. Here you can watch each
                one.
              </p>
            </div>
            <div className="flex space-x-4">
              <Button size="lg" className="h-12 px-8 group" asChild>
                <Link href="/experiment">
                  Open the playground
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Laptop or desktop browser required. The embedding model runs in
              your browser; the answer comes from Claude.
            </p>
          </div>
        </section>

        <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
            {features.map((feature, index) => (
              <div key={feature.title} className="contents">
                <div className="w-[280px] shrink-0">
                  <FeatureCard feature={feature} />
                </div>
                {index < features.length - 1 && <Arrow />}
              </div>
            ))}
          </div>
        </section>

        <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <h2 className="mb-3 text-xl font-semibold">Scenarios</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Each scenario preloads the corpus, the splitting settings, and a
            question, and says what to look for. Pick one from the menu at the
            top of the playground.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {SCENARIOS.map((scenario) => (
              <li key={scenario.id} className="rounded-lg border p-4">
                <p className="font-medium">{scenario.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {scenario.summary}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
