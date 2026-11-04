import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  /** optional prefix shown before the label (e.g. the department code) */
  hint?: string;
}

/** Accent-insensitive search so "herault" finds "Hérault" (cmdk is strict by default). */
const fold = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const accentInsensitiveFilter = (value: string, search: string) =>
  fold(value).includes(fold(search)) ? 1 : 0;

interface Props {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  /** max badges rendered in the trigger before switching to a counter */
  maxBadges?: number;
  /** used to build data-testid attributes: trigger / option / clear */
  testId?: string;
  /** accessible name for the trigger button */
  ariaLabel?: string;
  emptyLabel?: string;
}

/**
 * Multi-select dropdown: popover + searchable command list with checkboxes.
 * Selected values are summarised as badges (or a counter) in the trigger.
 */
export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder = "Rechercher…",
  maxBadges = 2,
  testId,
  ariaLabel,
  emptyLabel = "Aucun résultat.",
}: Props) {
  const [open, setOpen] = useState(false);

  const byValue = new Map(options.map((o) => [o.value, o]));
  const selectedOptions = selected
    .map((v) => byValue.get(v))
    .filter((o): o is MultiSelectOption => Boolean(o));

  const toggle = (value: string) =>
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel ?? placeholder}
          data-testid={testId ? `${testId}-trigger` : undefined}
          className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors hover-elevate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedOptions.length <= maxBadges ? (
              selectedOptions.map((o) => (
                <Badge
                  key={o.value}
                  variant="secondary"
                  className="h-5 max-w-full shrink-0 gap-0.5 px-1.5 text-[11px] font-normal"
                >
                  <span className="max-w-[130px] truncate">{o.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Retirer ${o.label}`}
                    data-testid={testId ? `${testId}-badge-remove-${o.value}` : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(selected.filter((v) => v !== o.value));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        e.preventDefault();
                        onChange(selected.filter((v) => v !== o.value));
                      }
                    }}
                    className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="h-5 gap-0.5 px-1.5 text-[11px] font-normal">
                {selectedOptions.length} sélectionnés
              </Badge>
            )}
          </span>
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Effacer la sélection"
              data-testid={testId ? `${testId}-clear` : undefined}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange([]);
                }
              }}
              className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command filter={accentInsensitiveFilter}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <CommandItem
                    key={o.value}
                    value={`${o.hint ?? ""} ${o.label}`}
                    onSelect={() => toggle(o.value)}
                    data-testid={testId ? `${testId}-option-${o.value}` : undefined}
                    className="gap-2"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50",
                      )}
                    >
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    {o.hint && <span className="font-mono text-xs text-muted-foreground">{o.hint}</span>}
                    <span className="truncate">{o.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
