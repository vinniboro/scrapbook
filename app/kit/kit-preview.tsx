"use client";

import {
  Button,
  buttonVariants,
  type ButtonVariant,
  Card,
  CardGrid,
  Checkbox,
  Dialog,
  Input,
  PageShell,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Slider,
  StaggerList,
  Surface,
  surfaceVariants,
  type SurfaceVariant,
  Switch,
  Textarea,
  Tooltip,
} from "@/components/ui";

const COLORS = [
  { name: "background", swatch: "bg-background" },
  { name: "foreground", swatch: "bg-foreground" },
  { name: "surface", swatch: "bg-surface" },
  { name: "secondary", swatch: "bg-secondary" },
  { name: "accent", swatch: "bg-accent" },
  { name: "hairline", swatch: "bg-hairline" },
] as const;

const TYPE = [
  { name: "display", className: "text-display font-semibold", sample: "Scrapbook" },
  { name: "title", className: "text-title font-medium", sample: "What have you been up to?" },
  { name: "body-lg", className: "text-body-lg", sample: "A social scrapbook, not a stage." },
  { name: "body", className: "text-body", sample: "Share with people you know. No algorithm." },
  { name: "caption", className: "text-caption font-mono tabular-nums", sample: "close · room" },
] as const;

const RADII = [
  { name: "sm", className: "rounded-sm" },
  { name: "card", className: "rounded-card" },
  { name: "panel", className: "rounded-panel" },
  { name: "float", className: "rounded-float" },
  { name: "pill", className: "rounded-pill" },
] as const;

const SHADOWS = [
  { name: "hairline", className: "shadow-hairline" },
  { name: "raised", className: "shadow-raised" },
  { name: "overlay", className: "shadow-overlay" },
] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title font-medium">{title}</h2>
      {children}
    </section>
  );
}

export function KitPreview() {
  return (
    <PageShell width="prose">
      <StaggerList className="flex flex-col gap-16 py-12">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-caption opacity-50">kit</p>
          <h1 className="text-display font-semibold">Tokens and components</h1>
          <p className="text-body opacity-70">
            Living reference. Product routes are unchanged.
          </p>
        </div>

        <Section title="Color">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLORS.map((color) => (
              <div key={color.name} className="flex flex-col gap-2">
                <div
                  className={`h-20 rounded-card shadow-hairline ${color.swatch}`}
                />
                <span className="font-mono text-caption">{color.name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div className="flex flex-col divide-y divide-hairline">
            {TYPE.map((row) => (
              <div key={row.name} className="flex flex-col gap-1 py-4">
                <span className="font-mono text-caption opacity-40">
                  text-{row.name}
                </span>
                <p className={row.className}>{row.sample}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radius">
          <div className="flex flex-wrap items-end gap-6">
            {RADII.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-16 bg-foreground/10 ${r.className}`} />
                <span className="font-mono text-caption">{r.name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Elevation">
          <div className="grid gap-4 sm:grid-cols-3">
            {SHADOWS.map((s) => (
              <div
                key={s.name}
                className={`flex h-28 items-center justify-center rounded-card bg-background ${s.className}`}
              >
                <span className="font-mono text-caption">shadow-{s.name}</span>
              </div>
            ))}
          </div>
          <div className="glass-effect flex h-28 items-center justify-center rounded-float">
            <span className="font-mono text-caption">glass-effect</span>
          </div>
        </Section>

        <Section title="Controls">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(buttonVariants) as ButtonVariant[]).map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <label className="flex w-full max-w-sm flex-col gap-1.5 text-sm font-medium">
            words
            <Input placeholder="a short line" />
          </label>
          <label className="flex w-full max-w-sm flex-col gap-1.5 text-sm font-medium">
            note
            <Textarea placeholder="what have you been up to?" />
          </label>
          <Select
            items={[
              { label: "close", value: "close" },
              { label: "room", value: "room" },
            ]}
            defaultValue="close"
            placeholder="where"
          />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked />
            keep this
          </label>
          <RadioGroup defaultValue="close" aria-label="visibility">
            <label className="flex items-center gap-2 text-sm">
              <Radio value="close" />
              close
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Radio value="room" />
              room
            </label>
          </RadioGroup>
          <label className="flex items-center gap-3 text-sm">
            <Switch defaultChecked />
            notify
          </label>
          <Slider defaultValue={40} aria-label="intensity" />
        </Section>

        <Section title="Components">
          <div className="flex flex-wrap gap-4">
            {(Object.keys(surfaceVariants) as SurfaceVariant[]).map(
              (variant) => (
                <Surface
                  key={variant}
                  variant={variant}
                  className="flex h-28 w-40 items-center justify-center rounded-float"
                >
                  {variant}
                </Surface>
              ),
            )}
          </div>
          <div className="w-full max-w-md">
            <Card
              href="#card"
              title="a photograph"
              subtitle="placed today"
              thumbnail={<div className="h-full w-full bg-secondary" />}
              meta={
                <span className="font-mono text-caption tabular-nums opacity-50">
                  close
                </span>
              }
            />
          </div>
          <CardGrid className="w-full">
            <div className="h-24 rounded-card bg-secondary" />
            <div className="h-24 rounded-card bg-secondary" />
            <div className="h-24 rounded-card bg-secondary" />
          </CardGrid>
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Skeleton className="h-40 w-full rounded-card" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Dialog.Root>
            <Dialog.Trigger render={<Button />}>Open dialog</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>
                <Dialog.Title>Save draft</Dialog.Title>
                <Dialog.Description>
                  This keeps the writing on this device.
                </Dialog.Description>
                <div className="flex justify-end gap-2">
                  <Dialog.Close>Close</Dialog.Close>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <div className="flex gap-2">
            <Tooltip content="Primary action">
              <Button>Save</Button>
            </Tooltip>
            <Tooltip content="Does not submit">
              <Button variant="ghost">Cancel</Button>
            </Tooltip>
          </div>
        </Section>
      </StaggerList>
    </PageShell>
  );
}
