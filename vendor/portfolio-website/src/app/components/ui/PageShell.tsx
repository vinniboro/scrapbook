import { cn } from "../../lib/cn";

const widths = {
  prose: "w-full max-w-[95ch] m-2",
  essay: "h-fit w-full md:w-1/2 xl:w-full xl:max-w-3xl m-4 my-28",
  wide: "w-full m-2",
} as const;

const frames = {
  prose: "flex justify-center md:m-20 m-4",
  essay: "flex justify-center",
  wide: "flex flex-col items-center my-28",
} as const;

type PageShellProps = {
  children: React.ReactNode;
  width?: keyof typeof widths;
  className?: string;
  innerClassName?: string;
};

export function PageShell({
  children,
  width = "prose",
  className,
  innerClassName,
}: PageShellProps) {
  return (
    <div className={cn(frames[width], className)}>
      <div className={cn("flex flex-col", widths[width], innerClassName)}>
        {children}
      </div>
    </div>
  );
}
