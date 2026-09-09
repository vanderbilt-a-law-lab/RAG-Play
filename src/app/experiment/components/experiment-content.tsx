"use client"

import { useCallback, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SplitSquareHorizontal, Boxes, Search, MessageSquare } from "lucide-react"
import { useEmbeddingWorker } from "@/app/hooks/useEmbeddingWorker"
import {
  RERANK_TOP_N,
  useEmbeddingStore,
} from "@/app/stores/experiment/embedding-store"
import {
  DEFAULT_MIN_CHUNK_SIZE,
  useTextSplittingStore,
} from "@/app/stores/experiment/text-splitting-store"
import { useGenerationStore } from "@/app/stores/experiment/generation-store"
import type { Scenario } from "@/app/experiment/constants/scenarios"
import { ScenarioPicker } from "./scenario-picker"
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
  const {
    blocks,
    resetText,
    setStrategy,
    setChunkSize,
    setOverlap,
    setParentChunkSize,
    setMinChunkSize,
  } = useTextSplittingStore()
  const {
    model,
    question,
    questionEmbedding,
    blocksEmbedding,
    baseRanking,
    rerankStatus,
    recalculateSimilarities,
    resetRetrieval,
    setQuestion,
  } = useEmbeddingStore()
  const { setPresetUserMessage, setEffort } = useGenerationStore()
  const embeddingWorker = useEmbeddingWorker({ blocks, model })

  useEffect(() => {
    if (questionEmbedding.length > 0 && blocksEmbedding.length > 0) {
      recalculateSimilarities()
    }
  }, [questionEmbedding, blocksEmbedding, recalculateSimilarities])

  // When the reranker is on, rescore the top of each new ranking.
  const { requestRerank } = embeddingWorker
  useEffect(() => {
    if (rerankStatus !== "pending" || baseRanking.length === 0) {
      return
    }
    const items = baseRanking
      .slice(0, RERANK_TOP_N)
      .map(({ index }) => ({ index, text: blocks[index]?.text ?? "" }))
      .filter((item) => item.text.length > 0)
    requestRerank(question, items)
  }, [baseRanking, rerankStatus, blocks, question, requestRerank])

  const handleStepChange = useCallback(
    (nextStep: string) => {
      if (!isExperimentStep(nextStep)) {
        return
      }

      const params = new URLSearchParams(searchParams.toString())
      params.set("step", nextStep)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const handleApplyScenario = useCallback(
    (scenario: Scenario) => {
      resetText()
      setStrategy(scenario.strategy)
      setChunkSize(scenario.chunkSize)
      setOverlap(scenario.overlap)
      setMinChunkSize(scenario.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE)
      if (scenario.parentChunkSize) {
        setParentChunkSize(scenario.parentChunkSize)
      }
      setQuestion(scenario.question)
      resetRetrieval(scenario.retrieval)
      setPresetUserMessage(scenario.userMessage ?? null)
      if (scenario.effort) {
        setEffort(scenario.effort)
      }
      embeddingWorker.debouncedGetEmbedding(scenario.question)
      toast.success(`Loaded scenario: ${scenario.title}`)
      handleStepChange(scenario.tab)
    },
    [
      embeddingWorker,
      handleStepChange,
      resetRetrieval,
      resetText,
      setChunkSize,
      setEffort,
      setMinChunkSize,
      setOverlap,
      setParentChunkSize,
      setPresetUserMessage,
      setQuestion,
      setStrategy,
    ]
  )

  return (
    <div className="space-y-4">
      <ScenarioPicker onApply={handleApplyScenario} />
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
    </div>
  )
}
