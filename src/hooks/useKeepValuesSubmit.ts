"use client";
import { startTransition, type FormEvent } from "react";

/** React 19 resets a <form action> after every submission, wiping input after a server-side error.
 *  Submitting through onSubmit + startTransition runs the same action without the reset. */
export function useKeepValuesSubmit(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
