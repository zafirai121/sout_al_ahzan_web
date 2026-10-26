import { formatDuration } from '@/utils/data_mapper';
import { countOf, HOURS, MINUTES } from '@/utils/plural';

/**
 * How long tracks last together: "92 ساعة", "3 ساعات و4 دقائق". Tracks never
 * measured count for nothing, so then it is "more than"; '' when none is.
 */
export function totalTime(durations: unknown[]): string {
  let seconds = 0;
  let measured = 0;
  for (const d of durations) {
    const parts = formatDuration(d).split(':').map(Number);
    if (parts.length < 2) continue;
    seconds += parts.reduce((sum, p) => sum * 60 + p, 0);
    measured++;
  }
  const minutes = Math.round(seconds / 60);
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const text = !hours ? countOf(minutes, MINUTES)
    : hours < 10 && rest ? `${countOf(hours, HOURS)} و${countOf(rest, MINUTES)}`
    : countOf(hours, HOURS);
  return measured < durations.length ? `أكثر من ${text}` : text;
}
