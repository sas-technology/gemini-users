// Compute narrative insights from a usage snapshot. Pure functions, no
// side effects, no Svelte — easy to test and to adjust thresholds.
//
// All insights are SNAPSHOT-based: they describe what the current period
// shows. Time-series narrative (week-over-week change, trends) requires
// snapshot history in the spreadsheet, which is a separate effort.
import type { UsageData, DivisionData, UserData, UsagePriority } from './types';

// Tunable thresholds. These are the levers product/T&I will want to
// adjust as the rollout evolves — keep them named, in one place.
export const THRESHOLDS = {
  // Pro license holders with this many active days or fewer are flagged
  // as candidates for license review.
  inactiveProActiveDaysAtMost: 0,
  // A user is "actively using Gemini" when their overall priority is at
  // least Low (i.e. not Zero).
  activePriorities: ['High', 'Medium', 'Low'] as UsagePriority[],
  // A non-Pro user with this priority is considered an upgrade candidate.
  upgradeCandidatePriority: 'High' as UsagePriority,
  // Number of users to surface in each operational list.
  operationalListLimit: 10,
} as const;

export interface ExecutiveSummary {
  sentences: string[];
  // Raw numbers behind each sentence — useful for tooltips/inspection
  // and for tests that don't want to assert on prose.
  facts: {
    proHolders: number;
    activeProHolders: number;
    inactiveProHolders: number;
    topDivision: { name: string; adoptionRate: number } | null;
    bottomDivision: { name: string; adoptionRate: number } | null;
    geminiSharePct: number;
    secondService: { name: string; sharePct: number } | null;
    staffCoveragePct: number;
    silentStaffCount: number;
    studentsWithAccess: number;
    studentsWithoutAccess: number;
  };
}

export interface OperationalList {
  id: string;
  title: string;
  description: string;
  users: Array<{ email: string; meta: string }>;
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function isActive(u: { overallUsagePriority: UsagePriority }): boolean {
  return THRESHOLDS.activePriorities.includes(u.overallUsagePriority);
}

export function computeExecutiveSummary(
  usage: UsageData | null,
  divisions: DivisionData | null,
  students: { withAccess: number; withoutAccess: number } | null
): ExecutiveSummary {
  const sentences: string[] = [];
  const empty: ExecutiveSummary['facts'] = {
    proHolders: 0,
    activeProHolders: 0,
    inactiveProHolders: 0,
    topDivision: null,
    bottomDivision: null,
    geminiSharePct: 0,
    secondService: null,
    staffCoveragePct: 0,
    silentStaffCount: 0,
    studentsWithAccess: 0,
    studentsWithoutAccess: 0,
  };

  if (!usage || usage.users.length === 0) {
    return {
      sentences: ['No usage data is available for this period yet.'],
      facts: empty,
    };
  }

  const users = usage.users;

  // 1. Pro license utilisation
  const proHolders = users.filter((u) => u.hasGeminiPro);
  const activeProHolders = proHolders.filter(isActive);
  const inactiveProHolders = proHolders.filter(
    (u) => u.activeDays <= THRESHOLDS.inactiveProActiveDaysAtMost
  );
  if (proHolders.length > 0) {
    const reviewClause =
      inactiveProHolders.length > 0
        ? ` ${inactiveProHolders.length} had no recorded activity — candidates for license review.`
        : '';
    sentences.push(
      `${activeProHolders.length} of ${proHolders.length} Pro license holders are actively using Gemini.${reviewClause}`
    );
  }

  // 2. Adoption gap by division
  let topDiv: { name: string; rate: number } | null = null;
  let bottomDiv: { name: string; rate: number } | null = null;
  if (divisions) {
    const ranked = Object.entries(divisions.divisions)
      .filter(([, d]) => d.userCount > 0)
      .map(([name, d]) => {
        const adopters = (d.priorityBreakdown.High ?? 0) + (d.priorityBreakdown.Medium ?? 0);
        return { name, rate: pct(adopters, d.userCount) };
      })
      .sort((a, b) => b.rate - a.rate);
    if (ranked.length >= 2) {
      topDiv = ranked[0];
      bottomDiv = ranked[ranked.length - 1];
      if (topDiv.rate !== bottomDiv.rate) {
        sentences.push(
          `${topDiv.name} leads adoption at ${topDiv.rate}% high or medium users; ${bottomDiv.name} lags at ${bottomDiv.rate}%.`
        );
      }
    }
  }

  // 3. Service mix — the Gemini service share, plus the runner-up
  const serviceTotals: Record<string, number> = {};
  for (const u of users) {
    for (const [service, count] of Object.entries(u.services)) {
      serviceTotals[service] = (serviceTotals[service] ?? 0) + count;
    }
  }
  const totalServiceUse = Object.values(serviceTotals).reduce((a, b) => a + b, 0);
  const geminiShare = pct(serviceTotals.Gemini ?? 0, totalServiceUse);
  const ranked = Object.entries(serviceTotals)
    .filter(([name]) => name !== 'Gemini')
    .sort((a, b) => b[1] - a[1]);
  const second = ranked[0];
  if (totalServiceUse > 0) {
    if (second) {
      sentences.push(
        `Gemini accounts for ${geminiShare}% of recorded activity; the next service, ${second[0]}, trails at ${pct(second[1], totalServiceUse)}%.`
      );
    } else {
      sentences.push(`Gemini accounts for ${geminiShare}% of recorded activity.`);
    }
  }

  // 4. Staff coverage
  const staffUsers = users.filter((u) => u.isStaff);
  const silentStaff = staffUsers.filter((u) => u.activeDays === 0);
  if (staffUsers.length > 0) {
    sentences.push(
      `${pct(staffUsers.length - silentStaff.length, staffUsers.length)}% of tracked staff show some activity this period; ${silentStaff.length} have been silent.`
    );
  }

  // 5. Student rollout
  if (students && (students.withAccess > 0 || students.withoutAccess > 0)) {
    sentences.push(
      `${students.withAccess} students have Gemini access; ${students.withoutAccess} do not.`
    );
  }

  return {
    sentences,
    facts: {
      proHolders: proHolders.length,
      activeProHolders: activeProHolders.length,
      inactiveProHolders: inactiveProHolders.length,
      topDivision: topDiv ? { name: topDiv.name, adoptionRate: topDiv.rate } : null,
      bottomDivision: bottomDiv ? { name: bottomDiv.name, adoptionRate: bottomDiv.rate } : null,
      geminiSharePct: geminiShare,
      secondService: second ? { name: second[0], sharePct: pct(second[1], totalServiceUse) } : null,
      staffCoveragePct:
        staffUsers.length > 0
          ? pct(staffUsers.length - silentStaff.length, staffUsers.length)
          : 0,
      silentStaffCount: silentStaff.length,
      studentsWithAccess: students?.withAccess ?? 0,
      studentsWithoutAccess: students?.withoutAccess ?? 0,
    },
  };
}

function topUsersByOverall(users: UserData[], limit: number) {
  return [...users]
    .sort((a, b) => b.overallUsage - a.overallUsage)
    .slice(0, limit)
    .map((u) => ({
      email: u.email,
      meta: `${u.overallUsage.toLocaleString()} actions · ${u.activeDays} active days`,
    }));
}

export function computeOperationalLists(usage: UsageData | null): OperationalList[] {
  if (!usage || usage.users.length === 0) return [];

  const limit = THRESHOLDS.operationalListLimit;

  const inactivePro = usage.users
    .filter(
      (u) => u.hasGeminiPro && u.activeDays <= THRESHOLDS.inactiveProActiveDaysAtMost
    )
    .map((u) => ({ email: u.email, meta: `Pro · ${u.activeDays} active days` }));

  const upgradeCandidates = usage.users
    .filter(
      (u) =>
        !u.hasGeminiPro && u.overallUsagePriority === THRESHOLDS.upgradeCandidatePriority
    )
    .sort((a, b) => b.overallUsage - a.overallUsage)
    .slice(0, limit)
    .map((u) => ({
      email: u.email,
      meta: `Basic · ${u.overallUsage.toLocaleString()} actions · ${u.activeDays} active days`,
    }));

  return [
    {
      id: 'pro-license-review',
      title: 'Pro licenses worth reviewing',
      description: `Pro holders with no recorded activity (${inactivePro.length} total)`,
      users: inactivePro.slice(0, limit),
    },
    {
      id: 'power-users',
      title: 'Top adopters',
      description: 'Highest overall activity this period',
      users: topUsersByOverall(usage.users, limit),
    },
    {
      id: 'upgrade-candidates',
      title: 'Pro upgrade candidates',
      description: `Basic users with High overall priority (${upgradeCandidates.length} total)`,
      users: upgradeCandidates,
    },
  ];
}
