"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-slate-200 shadow-lg font-sans",
          actionButton: "bg-indigo-600 text-white font-medium rounded-md px-2.5 py-1 text-xs",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
