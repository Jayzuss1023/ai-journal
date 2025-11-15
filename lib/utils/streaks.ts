// Minimal type for streak calculations - only needs _id and createdAt

type JournalEntry = {
  _id: string;
  createdAt: string;
};

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
  streakDates: string[];
}

/**
 * Our Journal Entries format is 2025-09-21 10:30
 * Converts date to YYYY-MM-DD format
 * Where the T separates the date and time component
 * [0] Will retrieve the first element of the array, which will be the date portion
 */
const toDateString = (date: Date | string): string =>
  new Date(date).toISOString().split("T")[0];

// Set() will add the entries to an array
// Use our toDateString function to return YYYY-MM-DD format
// localeCompare will return dates in a lexicographical order
// Gets unique entry dates sorted newest first b ---> a
const getUniqueDates = (entries: JournalEntry[]): string[] =>
  [...new Set(entries.map((entry) => toDateString(entry.createdAt)))].sort(
    (a, b) => b.localeCompare(a)
  );

/**
 * Creates date object and moves it by specifie days
 */

const addDays = (date: string, days: number): string => {
  const newDate = new Date(date); // Output: Mon Oct 15 2025
  // setDate() method sets the day of the month
  // getDate() method returns the day of the month
  newDate.setDate(newDate.getDate() + days);
  return toDateString(newDate);
};

/**
 * Calculates days between two dates
 */

const daysBetween = (date1: string, date2: string): number =>
  Math.floor(
    (new Date(date1).getTime() - new Date(date2).getTime()) /
      (1000 * 60 * 60 * 24)
  );

/**
 * Caluclates current streak starting from today or yesterday
 */
const calculateCurrentStreak = (
  entryDates: string[]
): { streak: number; dates: string[] } => {
  const today = toDateString(new Date());
  const yesterday = addDays(today, -1);

  const hasEntryToday = entryDates.includes(today);
  const startDate = hasEntryToday ? today : yesterday;

  // Generate consecutive dates backwards from start date
  const generateConsecutiveDates = (start: string): string[] =>
    Array.from({ length: entryDates.length }, (_, i) => addDays(start, -i));

  const consecutiveDates = generateConsecutiveDates(startDate);

  // The function stacks an array over another array and returns a new array with only the elements that are present in both arrays.
  const streakDates = consecutiveDates.filter((date) =>
    entryDates.includes(date)
  );

  // The function stacks one array over another array. If an element from the first array is not found in the second array, it returns the index of that element. If located at position 2 then it will break and return 2.
  // If no matching elements are found then it returns -1.
  const streakEndIndex = consecutiveDates.findIndex(
    (date) => !entryDates.includes(date)
  );

  const streak = streakEndIndex === -1 ? streakDates.length : streakEndIndex;

  return {
    streak,
    dates: streakDates.slice(0, streak).reverse(),
  };
};

/**
 * Finds the longest consecutive streak in the data
 */

const findLongestStreak = (entryDates: string[]): number => {
  if (!entryDates.length) return 0;

  //Create pairs of consecutive dates wieht their day differences
  const datePairs = entryDates.slice(1).map((date, i) => ({
    date,
    prevDate: entryDates[i],
    isConsecutive: daysBetween(entryDates[i], date) === 1,
  }));

  //   Group consecutive dates into streaks

  const streaks = datePairs.reduce(
    (acc, { isConsecutive }, index) => {
      if (isConsecutive) {
        acc[acc.length - 1] = (acc[acc.length - 1] || 1) + 1;
      } else {
        acc.push(1);
      }
      return acc;
    },
    [1] as number[]
  );

  return Math.max(...streaks);
};

/**
 * Calculates user's journaling streak statistics
 */

export const calculateStreaks = (entries: JournalEntry[]): StreakData => {
  if (!entries?.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null,
      streakDates: [],
    };
  }

  const entryDates = getUniqueDates(entries);
  const { streak: currentStreak, dates: streakDates } =
    calculateCurrentStreak(entryDates);
  const longestStreak = findLongestStreak(entryDates);

  return {
    currentStreak,
    longestStreak,
    lastEntryDate: entryDates[0] ?? null,
    streakDates,
  };
};

/**
 * Check if the user's current streak is active (entry today or yesterday)
 */
export const isStreakActive = (entries: JournalEntry[]): boolean => {
  if (!entries?.length) return false;

  const today = toDateString(new Date());
  const yesterday = addDays(today, -1);
  const entryDates = entries.map((entry) => toDateString(entry.createdAt));

  return entryDates.includes(today) || entryDates.includes(yesterday);
};

/**
 * Get streak status message for display
 */
export const getStreakStatusMessage = ({
  currentStreak,
  lastEntryDate,
}: StreakData): string => {
  if (currentStreak === 0) {
    return "Start your journaling streak today! ✨";
  }

  const hasEntryToday = lastEntryDate === toDateString(new Date());

  const messages = {
    1: hasEntryToday
      ? "Great start! Keep it going tomorrow! 🔥"
      : "1 day streak - write today to continue! 💪",
    default: hasEntryToday
      ? `Amazing! ${currentStreak} day streak! 🔥`
      : `${currentStreak} day streak - write today to continue! 🔥`,
  };

  return messages[currentStreak as keyof typeof messages] ?? messages.default;
};

/**
 * Calculates days until next milestone
 */
export const getDaysUntilNextMilestone = (
  currentStreak: number
): {
  daysUntil: number;
  milestone: number;
} => {
  const milestones = [5, 10, 25, 50, 100, 200, 365, 500, 1000];

  const nextMilestone =
    milestones.find((milestone) => currentStreak < milestone) ??
    Math.ceil(currentStreak / 100) * 100;

  return {
    daysUntil: nextMilestone - currentStreak,
    milestone: nextMilestone,
  };
};
