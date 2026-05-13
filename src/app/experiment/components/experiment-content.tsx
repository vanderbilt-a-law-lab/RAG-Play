"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SplitSquareHorizontal, Boxes, Search, MessageSquare } from "lucide-react"
import { useEmbeddingWorker } from "@/app/hooks/useEmbeddingWorker"
import { useEmbeddingStore } from "@/app/stores/experiment/embedding-store"
import { useTextSplittingStore } from "@/app/stores/experiment/text-splitting-store"
import { TextSplittingTab } from "./text-splitting-tab"
import { EmbeddingTab } from "./embedding-tab"
import { SemanticSearchTab } from "./semantic-search-tab"
import { GenerationTab } from "./generation-tab"

const experimentSteps = [
  "text-splitting",
  "embedding",
  "semantic-search",
  "generation",
] as const

type ExperimentStep = (typeof experimentSteps)[number]

const isExperimentStep = (step: string | null): step is ExperimentStep => {
  return experimentSteps.includes(step as ExperimentStep)
}

export function ExperimentContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedStep = searchParams.get("step")
  const activeStep = isExperimentStep(requestedStep)
    ? requestedStep
    : "text-splitting"
  const { blocks } = useTextSplittingStore()
  const { model, questionEmbedding, blocksEmbedding, recalculateSimilarities } =
    useEmbeddingStore()
  const embeddingWorker = useEmbeddingWorker({ blocks, model })

  useEffect(() => {
    if (questionEmbedding.length > 0 && blocksEmbedding.length > 0) {
      recalculateSimilarities()
    }
  }, [questionEmbedding, blocksEmbedding, recalculateSimilarities])

  const handleStepChange = (nextStep: string) => {
    if (!isExperimentStep(nextStep)) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("step", nextStep)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={activeStep} onValueChange={handleStepChange} className="space-y-4">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
        <TabsTrigger value="text-splitting" className="space-x-2">
          <SplitSquareHorizontal className="h-4 w-4" />
          <span>Text Splitting</span>
        </TabsTrigger>
        <TabsTrigger value="embedding" className="space-x-2">
          <Boxes className="h-4 w-4" />
          <span>Vector Embedding</span>
        </TabsTrigger>
        <TabsTrigger value="semantic-search" className="space-x-2">
          <Search className="h-4 w-4" />
          <span>Semantic Search</span>
        </TabsTrigger>
        <TabsTrigger value="generation" className="space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span>Context Generation</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text-splitting" forceMount>
        <TextSplittingTab />
      </TabsContent>

      <TabsContent value="embedding" forceMount>
        <EmbeddingTab embeddingWorker={embeddingWorker} />
      </TabsContent>

      <TabsContent value="semantic-search" forceMount>
        <SemanticSearchTab embeddingWorker={embeddingWorker} />
      </TabsContent>

      <TabsContent value="generation" forceMount>
        <GenerationTab />
      </TabsContent>
    </Tabs>
  )
} 
