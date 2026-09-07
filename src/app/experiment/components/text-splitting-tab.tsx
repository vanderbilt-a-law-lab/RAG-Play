import { StrategySelector } from "@/app/experiment/components/text-splitting/StrategySelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SeparatorManager } from "@/app/experiment/components/separator-manager";
import { ChunkSizeInput } from "@/app/experiment/components/text-splitting/ChunkSizeInput";
import { OverlapSizeInput } from "@/app/experiment/components/text-splitting/OverlapSizeInput";
import { SourceDocumentInput } from "@/app/experiment/components/text-splitting/SourceDocumentInput";
import { GeneratedChunks } from "@/app/experiment/components/text-splitting/GeneratedChunks";

export function TextSplittingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Text Splitting</CardTitle>
        <CardDescription>
          Before anything can be searched, each document is cut into chunks.
          The model will later see only the chunks that get retrieved, not the
          whole document.
        </CardDescription>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start space-x-2">
            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <div>
              <strong className="text-foreground">
                Fixed Character strategy:
              </strong>{" "}
              Cuts the text into pieces of a set length at the chosen
              separator. Simple and fast; ignores headings, sections, and
              sentences.
            </div>
          </li>
          <li className="flex items-start space-x-2">
            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
            <div>
              <strong className="text-foreground">
                Recursive character strategy:
              </strong>{" "}
              Tries to break at paragraphs first, then lines, then spaces, so
              pieces tend to end at natural boundaries. The usual default.
            </div>
          </li>
          <li className="flex items-start space-x-2">
            <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
            <div>
              <strong className="text-foreground">
                Parent-Child character strategy:
              </strong>{" "}
              Matches on small pieces but hands the model the larger section
              each piece came from. Closer to what commercial legal research
              tools do.
            </div>
          </li>
        </ul>
        <blockquote className="text-xs text-muted-foreground border-l-4 border-muted-foreground/25 px-4 py-2 space-y-2">
          A chunk can come out longer than the chunk size when a single
          paragraph is longer than the limit, or when the splitter merges
          pieces back together. The number on each chunk is its length.
        </blockquote>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Split Strategy:</span>
          <StrategySelector />
        </div>
        <div className="flex items-center space-x-4">
          <ChunkSizeInput />
          <OverlapSizeInput />
        </div>

        <SeparatorManager />

        <div className="grid grid-cols-2 gap-6">
          <SourceDocumentInput />
          <GeneratedChunks />
        </div>
      </CardContent>
    </Card>
  );
}
