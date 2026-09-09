import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LEGAL_CORPUS } from "@/app/experiment/constants/legal-corpus";

const TYPE_LABELS: Record<string, string> = {
  opinion: "Court opinion",
  rule: "Procedural rule",
  order: "Standing order",
  contract: "Contract",
  "proposed-rule": "Proposed rule",
};

export const CorpusLegend = () => (
  <ol className="space-y-1.5 rounded-md border bg-muted/30 p-3 text-xs">
    {LEGAL_CORPUS.map((doc, index) => (
      <li key={doc.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-semibold">{index + 1}.</span>
        <span className="font-medium">{doc.shortTitle}</span>
        <span className="text-muted-foreground">
          {TYPE_LABELS[doc.type] ?? doc.type} · {doc.jurisdiction} · {doc.dateLabel}
          {doc.note ? ` · ${doc.note}` : ""}
        </span>
        <Link
          href={doc.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-primary"
          aria-label={`Open the source for ${doc.shortTitle}`}
        >
          source <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </li>
    ))}
  </ol>
);
