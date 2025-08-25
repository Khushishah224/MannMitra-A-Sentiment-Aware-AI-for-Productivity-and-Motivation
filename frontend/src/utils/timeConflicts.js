// Shared time conflict utilities
// Supports 24h (HH:MM) and 12h (HH:MM AM/PM) inputs.

// Parse a time string into minutes from midnight. Returns null if invalid.
export function parseTimeToMinutes(str) {
  if (!str || typeof str !== 'string') return null;
  let s = str.trim();
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampmMatch) {
    let hh = parseInt(ampmMatch[1], 10);
    const mm = parseInt(ampmMatch[2], 10);
    const ap = ampmMatch[3].toUpperCase();
    if (hh === 12) hh = 0; // 12 AM -> 0
    if (ap === 'PM') hh += 12; // add 12 for PM (except 12 PM handled because hh reset only for AM)
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }
  // 24h format
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hh = parseInt(m24[1], 10);
    const mm = parseInt(m24[2], 10);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }
  return null;
}

export function minutesToHHMM(mins) {
  if (mins == null || mins < 0) return '';
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

// Normalize plan objects into interval list
function buildIntervals(plans, ignoreId) {
  return (plans || [])
    .filter(p => p && p.scheduled_time && p.duration_minutes)
    .filter(p => !ignoreId || p.id !== ignoreId)
    .map(p => {
      const start = parseTimeToMinutes(p.scheduled_time);
      if (start == null) return null;
      return { id: p.id, title: p.title, start, end: start + (p.duration_minutes || 0), duration: p.duration_minutes };
    })
    .filter(Boolean)
    .sort((a,b)=>a.start-b.start);
}

// Detect overlap of candidate interval with existing intervals
export function hasOverlap(plans, candidateTime, duration, ignoreId=null) {
  if (!candidateTime || !duration) return false;
  const start = parseTimeToMinutes(candidateTime);
  if (start == null) return false;
  const end = start + duration;
  const intervals = buildIntervals(plans, ignoreId);
  return intervals.some(iv => start < iv.end && iv.start < end);
}

// Compute next free start time >= candidate ensuring no overlap
export function computeNextFree(plans, candidateTime, duration, ignoreId=null, maxDepth=200) {
  if (!candidateTime || !duration) return '';
  let start = parseTimeToMinutes(candidateTime);
  if (start == null) return '';
  const intervals = buildIntervals(plans, ignoreId);
  let moved = false; let guard=0;
  while (guard++ < maxDepth) {
    const ov = intervals.find(iv => start < iv.end && iv.start < start + duration);
    if (!ov) break;
    start = Math.max(start, ov.end);
    moved = true;
  }
  if (!moved || start >= 24*60) return '';
  return minutesToHHMM(start);
}

// Compute chain shifts: if new interval overlaps others, shift each conflicting existing interval sequentially after previous.
// Returns array of { id, newStart } excluding the new task itself. Does not consider beyond midnight.
export function computeChainShifts(plans, newStartTime, newDuration) {
  const newStart = parseTimeToMinutes(newStartTime);
  if (newStart == null) return [];
  let cursorEnd = newStart + newDuration;
  const intervals = buildIntervals(plans, null);
  const affected = [];
  for (const iv of intervals) {
    // if existing starts before our end and ends after our start -> overlap or adjacency (treat adjacency as ok)
    if (iv.start < cursorEnd && iv.end > newStart) {
      // shift this interval to cursorEnd
      const shiftedStart = cursorEnd;
      affected.push({ id: iv.id, newStart: shiftedStart, duration: iv.duration });
      cursorEnd = shiftedStart + iv.duration;
    } else if (iv.start >= cursorEnd) {
      // no further overlap chain since sorted
      break;
    }
    if (cursorEnd >= 24*60) break; // stop at day boundary
  }
  return affected.map(a => ({ id: a.id, newStartHHMM: minutesToHHMM(a.newStart) }));
}

// Convenience: convert chain shifts list to promise updates using provided update function
export async function applyChainShifts(shifts, updateFn) {
  for (const s of shifts) {
    try {
      await updateFn(s.id, { scheduled_time: s.newStartHHMM });
    } catch (e) {
      // swallow individual errors and continue
      // eslint-disable-next-line no-console
      console.error('Chain shift failed for', s.id, e);
    }
  }
  return true;
}

export default {
  parseTimeToMinutes,
  minutesToHHMM,
  hasOverlap,
  computeNextFree,
  computeChainShifts,
  applyChainShifts
};
