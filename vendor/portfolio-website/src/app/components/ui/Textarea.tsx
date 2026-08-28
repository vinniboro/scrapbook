"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { mergeClass } from "../../lib/cn";
import { fieldControl } from "./styles";

type TextareaProps = BaseInput.Props & {
  rows?: number;
};

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <BaseInput
      render={<textarea rows={rows} />}
      className={mergeClass(className, fieldControl, "min-h-28 resize-y py-3")}
      {...props}
    />
  );
}
