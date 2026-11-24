export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

export const formatDuration = (startDate: string, endDate: string) => {
  const start = Date.parse(`${startDate.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${endDate.slice(0, 10)}T00:00:00Z`);
  const nights = Math.round((end - start) / 86_400_000);
  return Number.isFinite(nights) && nights >= 0
    ? `${nights + 1} days, ${nights} nights`
    : "";
};

/** Today in India as "YYYY-MM-DD" */
export const todayIST = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());