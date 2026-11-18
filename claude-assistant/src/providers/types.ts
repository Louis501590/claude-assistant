import type { Snapshot } from "@/core/types";

/**
 * Every data source implements this contract. The UI and the assistant only
 * ever talk to providers through it, so swapping Demo → real Gmail / IMAP /
 * fitness API is a one-file change in `providers/registry.ts`.
 */
export interface DataProvider<T> {
  readonly id: string;
  readonly label: string;
  fetch(signal?: AbortSignal): Promise<Snapshot<T>>;
}
