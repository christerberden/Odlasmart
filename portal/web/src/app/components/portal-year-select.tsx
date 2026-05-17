"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PortalYearSelectProps = {
  currentYear: number;
  years: number[];
};

export function PortalYearSelect({ currentYear, years }: PortalYearSelectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedYear = searchParams.get("year") ?? String(currentYear);

  function changeYear(year: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (year === String(currentYear)) {
      params.delete("year");
    } else {
      params.set("year", year);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="quick-year">
      <span>År</span>
      <select value={selectedYear} onChange={(event) => changeYear(event.target.value)}>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}
