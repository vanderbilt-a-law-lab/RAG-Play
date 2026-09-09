import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMBEDDING_MODEL_OPTIONS,
  EmbeddingModel,
  getEmbeddingModelOption,
} from "@/app/experiment/types/embedding";
import { EMBEDDING_CONSTANTS } from "@/app/hooks";

interface ModelSelectorProps {
  model: EmbeddingModel;
  onModelChange: (model: EmbeddingModel) => void;
}

export function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const current = getEmbeddingModelOption(model);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-sm font-medium">Embedding Model:</span>
      <Select value={model} onValueChange={(value) => onModelChange(value as EmbeddingModel)}>
        <SelectTrigger
          className="w-[400px]"
          style={{ width: EMBEDDING_CONSTANTS.SELECTOR_WIDTH }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EMBEDDING_MODEL_OPTIONS.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">{current.note}</span>
    </div>
  );
}
