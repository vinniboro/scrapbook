import { cn } from "@/components/ui";

export const placeKinds = [
  { id: "image", label: "photograph", hint: "a picture you took" },
  { id: "text", label: "words", hint: "a note, as it is" },
  { id: "book", label: "book", hint: "something you are reading" },
  { id: "music", label: "music", hint: "a song or a record" },
] as const;

export type PlaceKind = (typeof placeKinds)[number]["id"];

export function CreateSheet({
  value,
  onChange,
}: {
  value: PlaceKind;
  onChange: (kind: PlaceKind) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3" role="listbox" aria-label="kind">
      {placeKinds.map((kind) => {
        const selected = value === kind.id;
        return (
          <button
            key={kind.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(kind.id)}
            className={cn(
              "h-auto w-full flex-col items-start gap-1 rounded-plate px-4 py-5 text-left shadow-hairline",
              selected ? "bg-secondary" : "bg-background",
            )}
          >
            <span className="type-title">{kind.label}</span>
            <span className="text-caption font-normal opacity-50">{kind.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
