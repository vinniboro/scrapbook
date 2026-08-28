"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { mergeClass } from "../../lib/cn";
import { fieldControl } from "./styles";

export function Input({ className, ...props }: BaseInput.Props) {
  return (
    <BaseInput className={mergeClass(className, fieldControl, "h-11")} {...props} />
  );
}
