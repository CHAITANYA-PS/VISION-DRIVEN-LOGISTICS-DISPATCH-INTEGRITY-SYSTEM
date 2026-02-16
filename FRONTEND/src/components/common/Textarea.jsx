import * as React from "react";
import { cn } from "../../utils/helpers";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-gray-300 placeholder:text-gray-400 focus-visible:border-primary focus-visible:ring-primary/50 flex min-h-16 w-full rounded-md border bg-gray-50 px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };









