"use client";

import { DailyDataProvider } from "./DailyDataProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <DailyDataProvider>{children}</DailyDataProvider>;
}
