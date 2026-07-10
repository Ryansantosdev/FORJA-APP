"use client";

import { Droplets } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr } from "@/lib/dates";
import { invalidateDailyCache } from "@/components/DailyDataProvider";
import { patchDailyAguaMl } from "@/lib/patch-daily";
import { formatLitersFromMl } from "@/lib/format";

export default function QuickWaterButton({
  aguaMl,
  copoMl,
  disabled,
}: {
  aguaMl: number;
  copoMl: number;
  disabled?: boolean;
}) {
  const copo = copoMl > 0 ? copoMl : 250;

  async function addCopo() {
    const novo = aguaMl + copo;
    patchDailyAguaMl(novo);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("daily_logs").upsert(
      { user_id: user.id, date: todayStr(), agua_ml: novo },
      { onConflict: "user_id,date" }
    );
    invalidateDailyCache();
  }

  return (
    <button
      type="button"
      onClick={() => void addCopo()}
      disabled={disabled}
      className="btn-ghost flex w-full items-center justify-center gap-2 border border-water/20 py-2.5 text-xs text-water disabled:opacity-50"
    >
      <Droplets size={14} />
      +1 copo ({formatLitersFromMl(copo)})
    </button>
  );
}
