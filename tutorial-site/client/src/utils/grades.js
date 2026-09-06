export const GRADES = ["10", "11", "12"];

export function gradeLabel(grade, t) {
  return t?.filters?.[`grade${grade}`] || `Grade ${grade}`;
}

export function matchesGrade(item, grade) {
  if (!grade) return true;
  return (item?.grades || []).map(String).includes(grade);
}

// "Paid" is anything not permanently free -- that deliberately includes
// items in a free-for-1-month trial (freeUntil set, isFree false), since
// those are paid items that happen to have a temporary free window, not a
// third bucket of their own. The freeTrial badge already flags that state
// separately on the card.
export function matchesAccess(item, access) {
  if (!access) return true;
  if (access === "free") return Boolean(item?.isFree);
  if (access === "paid") return !item?.isFree;
  return true;
}

// Pulls grade numbers (10/11/12) out of free-typed search text so "grade
// 10", "Grade10", or a bare "10" all match items tagged with that grade --
// without this, grade only worked through the dedicated grade chips.
function extractGradeTokens(text) {
  const found = text.match(/\d+/g) || [];
  return found.filter((n) => GRADES.includes(n));
}

export function matchesQuery(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if ((item?.title || "").toLowerCase().includes(q)) return true;
  if ((item?.description || "").toLowerCase().includes(q)) return true;

  const tokens = extractGradeTokens(q);
  if (tokens.length === 0) return false;
  const itemGrades = (item?.grades || []).map(String);
  return tokens.some((tok) => itemGrades.includes(tok));
}
