"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCENARIOS, type Scenario } from "@/app/experiment/constants/scenarios";
import { Eye, PlayCircle } from "lucide-react";

interface ScenarioPickerProps {
  onApply: (scenario: Scenario) => void;
}

export function ScenarioPicker({ onApply }: ScenarioPickerProps) {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);
  const selected =
    SCENARIOS.find((scenario) => scenario.id === selectedId) ?? SCENARIOS[0];

  const handleApply = (): void => {
    onApply(selected);
  };

  return (
    <section
      aria-label="Scenarios"
      className="rounded-lg border bg-muted/30 p-4 space-y-3"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm font-medium">Scenario:</span>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full sm:w-[360px]" aria-label="Choose a scenario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENARIOS.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleApply}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleApply();
            }
          }}
          aria-label={`Load scenario: ${selected.title}`}
          className="gap-2"
        >
          <PlayCircle className="h-4 w-4" aria-hidden />
          Load scenario
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{selected.summary}</p>
      <p className="flex items-start gap-2 text-sm">
        <Eye className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span>
          <span className="font-medium">What to watch: </span>
          {selected.watchFor}
        </span>
      </p>
    </section>
  );
}
