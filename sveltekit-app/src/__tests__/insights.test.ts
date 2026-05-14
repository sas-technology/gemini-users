import { describe, it, expect } from 'vitest';
import {
  computeExecutiveSummary,
  computeOperationalLists,
  computeDivisionInsights,
  computeUserInsight,
} from '../lib/insights';
import type {
  UsageData,
  DivisionData,
  UserData,
  UserProfile,
  ServiceCounts,
  ServicePriorities,
  UsagePriority,
  Division,
  DivisionUser,
} from '../lib/types';

const ZERO_SERVICES: ServiceCounts = {
  Gmail: 0,
  Docs: 0,
  Sheets: 0,
  Slides: 0,
  Drive: 0,
  Meet: 0,
  Gemini: 0,
};
const ZERO_SERVICE_PRIORITIES: ServicePriorities = {
  Gmail: 'Zero',
  Docs: 'Zero',
  Sheets: 'Zero',
  Slides: 'Zero',
  Drive: 'Zero',
  Meet: 'Zero',
  Gemini: 'Zero',
};

function user(overrides: Partial<UserData> = {}): UserData {
  return {
    email: 'a@example.com',
    overallUsage: 0,
    overallUsagePriority: 'Zero',
    activeDays: 0,
    hasGeminiPro: false,
    isStaff: true,
    isStudent: false,
    services: { ...ZERO_SERVICES },
    servicesPriority: { ...ZERO_SERVICE_PRIORITIES },
    ...overrides,
  };
}

function usageOf(users: UserData[]): UsageData {
  return {
    users,
    untrackedUsers: { count: 0, users: [] },
    studentsNoGeminiCount: 0,
  };
}

function divisionsOf(input: Record<string, Record<UsagePriority, number>>): DivisionData {
  const divisions: DivisionData['divisions'] = {};
  for (const [name, breakdown] of Object.entries(input)) {
    const userCount = Object.values(breakdown).reduce((a, b) => a + b, 0);
    divisions[name] = {
      userCount,
      proCount: 0,
      totalActiveDays: 0,
      avgActiveDays: 0,
      priorityBreakdown: breakdown,
      users: [],
      topUsers: [],
    };
  }
  return { divisions };
}

describe('computeExecutiveSummary', () => {
  it('returns an empty-state sentence when there is no data', () => {
    const result = computeExecutiveSummary(null, null, null);
    expect(result.sentences).toEqual(['No usage data is available for this period yet.']);
    expect(result.facts.proHolders).toBe(0);
  });

  it('counts active vs inactive Pro holders', () => {
    const usage = usageOf([
      user({ email: 'p1@x', hasGeminiPro: true, overallUsagePriority: 'High', activeDays: 20 }),
      user({ email: 'p2@x', hasGeminiPro: true, overallUsagePriority: 'Low', activeDays: 5 }),
      user({ email: 'p3@x', hasGeminiPro: true, overallUsagePriority: 'Zero', activeDays: 0 }),
      user({ email: 'b1@x', hasGeminiPro: false, overallUsagePriority: 'High', activeDays: 12 }),
    ]);
    const result = computeExecutiveSummary(usage, null, null);
    expect(result.facts.proHolders).toBe(3);
    expect(result.facts.activeProHolders).toBe(2);
    expect(result.facts.inactiveProHolders).toBe(1);
    expect(result.sentences[0]).toContain('2 of 3 Pro license holders');
    expect(result.sentences[0]).toContain('1 had no recorded activity');
  });

  it('reports the leading and lagging division by adoption rate', () => {
    const usage = usageOf([user({ hasGeminiPro: true, overallUsagePriority: 'High' })]);
    const divisions = divisionsOf({
      'High School': { High: 8, Medium: 2, Low: 0, Zero: 0 },
      'Middle School': { High: 1, Medium: 1, Low: 3, Zero: 5 },
    });
    const result = computeExecutiveSummary(usage, divisions, null);
    expect(result.facts.topDivision?.name).toBe('High School');
    expect(result.facts.topDivision?.adoptionRate).toBe(100);
    expect(result.facts.bottomDivision?.name).toBe('Middle School');
    expect(result.facts.bottomDivision?.adoptionRate).toBe(20);
    expect(result.sentences.some((s) => s.includes('High School leads adoption at 100%'))).toBe(
      true
    );
  });

  it('skips the division sentence when adoption is identical (no story to tell)', () => {
    const usage = usageOf([user({ hasGeminiPro: true, overallUsagePriority: 'High' })]);
    const divisions = divisionsOf({
      A: { High: 1, Medium: 0, Low: 0, Zero: 0 },
      B: { High: 1, Medium: 0, Low: 0, Zero: 0 },
    });
    const result = computeExecutiveSummary(usage, divisions, null);
    expect(result.sentences.some((s) => s.includes('leads adoption'))).toBe(false);
  });

  it('reports Gemini share and the runner-up service', () => {
    const usage = usageOf([
      user({
        services: { ...ZERO_SERVICES, Gemini: 60, Gmail: 30, Docs: 10 },
      }),
    ]);
    const result = computeExecutiveSummary(usage, null, null);
    expect(result.facts.geminiSharePct).toBe(60);
    expect(result.facts.secondService?.name).toBe('Gmail');
    expect(result.facts.secondService?.sharePct).toBe(30);
  });

  it('handles missing student data gracefully', () => {
    const usage = usageOf([user()]);
    const result = computeExecutiveSummary(usage, null, null);
    expect(result.sentences.some((s) => s.includes('students have Gemini access'))).toBe(false);
  });
});

function divisionUser(overrides: Partial<DivisionUser> = {}): DivisionUser {
  return {
    email: 'd@example.com',
    name: 'Dee',
    jobTitle: 'Teacher',
    hasGeminiPro: false,
    priority: 'Zero',
    activeDays: 0,
    ...overrides,
  };
}

function division(overrides: Partial<Division> = {}): Division {
  return {
    userCount: 10,
    proCount: 4,
    totalActiveDays: 50,
    avgActiveDays: 5,
    priorityBreakdown: { High: 2, Medium: 3, Low: 2, Zero: 3 },
    users: [],
    topUsers: [],
    ...overrides,
  };
}

describe('computeDivisionInsights', () => {
  it('returns an empty array when there are no divisions', () => {
    expect(computeDivisionInsights(null)).toEqual([]);
  });

  it('describes adoption, average days, and Pro review candidates per division', () => {
    const result = computeDivisionInsights({
      divisions: {
        'High School': division({
          userCount: 10,
          proCount: 6,
          avgActiveDays: 7.5,
          priorityBreakdown: { High: 5, Medium: 3, Low: 1, Zero: 1 },
          users: [
            divisionUser({ email: 'p1@x', hasGeminiPro: true, activeDays: 0 }),
            divisionUser({ email: 'p2@x', hasGeminiPro: true, activeDays: 12 }),
          ],
          topUsers: [divisionUser({ email: 'p2@x', hasGeminiPro: true, activeDays: 12 })],
        }),
      },
    });
    expect(result).toHaveLength(1);
    const hs = result[0];
    expect(hs.facts.proAdoptionPct).toBe(60);
    expect(hs.facts.activeAdoptionPct).toBe(80);
    expect(hs.facts.inactiveProCount).toBe(1);
    expect(hs.facts.topUserEmail).toBe('p2@x');
    expect(hs.sentences.some((s) => s.includes('1 Pro holder had no recorded activity'))).toBe(
      true
    );
    expect(hs.sentences.some((s) => s.includes('Top adopter'))).toBe(true);
  });

  it('handles an empty division gracefully', () => {
    const result = computeDivisionInsights({
      divisions: {
        Empty: division({
          userCount: 0,
          proCount: 0,
          avgActiveDays: 0,
          priorityBreakdown: { High: 0, Medium: 0, Low: 0, Zero: 0 },
          users: [],
          topUsers: [],
        }),
      },
    });
    expect(result[0].sentences[0]).toBe('No users tracked in this division yet.');
  });
});

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    email: 'u@example.com',
    name: 'User',
    division: 'High School',
    jobTitle: 'Teacher',
    personId: '1',
    hasGeminiPro: false,
    overallUsage: 0,
    overallPriority: 'Zero',
    activeDays: 0,
    services: { ...ZERO_SERVICES },
    servicesPriority: { ...ZERO_SERVICE_PRIORITIES },
    divisionAvg: { activeDays: 0, userCount: 0 },
    ...overrides,
  };
}

describe('computeUserInsight', () => {
  it('returns null for a missing profile', () => {
    expect(computeUserInsight(null)).toBeNull();
  });

  it('flags a Pro holder with no activity for license review', () => {
    const insight = computeUserInsight(
      profile({ hasGeminiPro: true, activeDays: 0, divisionAvg: { activeDays: 5, userCount: 12 } })
    );
    expect(insight?.facts.licenseRecommendation).toBe('review');
    expect(insight?.sentences.some((s) => s.includes('candidate for license review'))).toBe(true);
  });

  it('marks Basic + High priority as upgrade candidate', () => {
    const insight = computeUserInsight(
      profile({
        overallPriority: 'High',
        activeDays: 20,
        divisionAvg: { activeDays: 8, userCount: 10 },
      })
    );
    expect(insight?.facts.licenseRecommendation).toBe('upgrade');
    expect(insight?.facts.activeDaysVsDivisionAvg).toBe('above');
  });

  it('identifies the leading service', () => {
    const insight = computeUserInsight(
      profile({
        services: { ...ZERO_SERVICES, Gemini: 100, Docs: 50 },
        divisionAvg: { activeDays: 5, userCount: 10 },
      })
    );
    expect(insight?.facts.primaryService?.name).toBe('Gemini');
    expect(insight?.facts.primaryService?.count).toBe(100);
  });
});

describe('computeOperationalLists', () => {
  it('returns empty when there is no data', () => {
    expect(computeOperationalLists(null)).toEqual([]);
    expect(computeOperationalLists(usageOf([]))).toEqual([]);
  });

  it('builds Pro-license-review, top-adopters, and upgrade-candidate lists', () => {
    const usage = usageOf([
      user({ email: 'pro-active@x', hasGeminiPro: true, overallUsage: 100, activeDays: 12 }),
      user({ email: 'pro-silent@x', hasGeminiPro: true, overallUsage: 0, activeDays: 0 }),
      user({
        email: 'basic-heavy@x',
        hasGeminiPro: false,
        overallUsage: 500,
        overallUsagePriority: 'High',
        activeDays: 20,
      }),
      user({
        email: 'basic-light@x',
        hasGeminiPro: false,
        overallUsage: 5,
        overallUsagePriority: 'Low',
        activeDays: 1,
      }),
    ]);
    const lists = computeOperationalLists(usage);
    const byId = Object.fromEntries(lists.map((l) => [l.id, l]));

    expect(byId['pro-license-review'].users.map((u) => u.email)).toEqual(['pro-silent@x']);
    expect(byId['power-users'].users[0].email).toBe('basic-heavy@x');
    expect(byId['upgrade-candidates'].users.map((u) => u.email)).toEqual(['basic-heavy@x']);
  });
});
