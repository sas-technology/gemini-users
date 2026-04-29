'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar, Scatter } from 'react-chartjs-2';
import type {
  UsageData,
  StudentData,
  DivisionData,
  UserData,
  UsagePriority,
  ServiceName,
} from '@/types';
import { SERVICES } from '@/types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

const CHART_COLORS = {
  red: '#a0192a',
  orange: '#ee7103',
  yellow: '#fabc00',
  green: '#009754',
  purple: '#c42384',
  gray: '#97999c',
  blue: '#1a2d58',
};
const SERVICE_COLORS = [
  '#ee7103',
  '#1a2d58',
  '#009754',
  '#e6413d',
  '#1284ad',
  '#c42384',
  '#fdc013',
];
const PRIORITY_COLORS = { High: '#ff0000', Medium: '#ff9900', Low: '#ffcc00', Zero: '#28a745' };

type QuickFilter = 'all' | 'pro' | 'basic' | 'non-active-staff' | 'students';

interface Stats {
  total: number;
  totalUsage: number;
  avgUsage: number;
  priority: Record<UsagePriority, { count: number; pro: number; basic: number }>;
  geminiPro: { count: number; totalUsage: number; avgUsage: number; geminiUsage: number };
  basic: { count: number; totalUsage: number; avgUsage: number; geminiUsage: number };
  services: Record<string, { total: number; pro: number; basic: number }>;
  topUsers: UserData[];
}

function calcStats(data: UserData[]): Stats {
  const stats: Stats = {
    total: data.length,
    totalUsage: 0,
    avgUsage: 0,
    priority: {
      High: { count: 0, pro: 0, basic: 0 },
      Medium: { count: 0, pro: 0, basic: 0 },
      Low: { count: 0, pro: 0, basic: 0 },
      Zero: { count: 0, pro: 0, basic: 0 },
    },
    geminiPro: { count: 0, totalUsage: 0, avgUsage: 0, geminiUsage: 0 },
    basic: { count: 0, totalUsage: 0, avgUsage: 0, geminiUsage: 0 },
    services: Object.fromEntries(SERVICES.map((s) => [s, { total: 0, pro: 0, basic: 0 }])),
    topUsers: [],
  };
  for (const u of data) {
    const usage = u.overallUsage;
    stats.totalUsage += usage;
    const p = u.overallUsagePriority;
    stats.priority[p].count++;
    if (u.hasGeminiPro) {
      stats.priority[p].pro++;
    } else {
      stats.priority[p].basic++;
    }
    const gUsage = u.services.Gemini;
    if (u.hasGeminiPro) {
      stats.geminiPro.count++;
      stats.geminiPro.totalUsage += usage;
      stats.geminiPro.geminiUsage += gUsage;
    } else {
      stats.basic.count++;
      stats.basic.totalUsage += usage;
      stats.basic.geminiUsage += gUsage;
    }
    for (const svc of SERVICES) {
      const v = u.services[svc];
      stats.services[svc].total += v;
      if (v > 0) {
        if (u.hasGeminiPro) {
          stats.services[svc].pro++;
        } else {
          stats.services[svc].basic++;
        }
      }
    }
  }
  stats.avgUsage = stats.total > 0 ? Math.round(stats.totalUsage / stats.total) : 0;
  stats.geminiPro.avgUsage =
    stats.geminiPro.count > 0 ? Math.round(stats.geminiPro.totalUsage / stats.geminiPro.count) : 0;
  stats.basic.avgUsage =
    stats.basic.count > 0 ? Math.round(stats.basic.totalUsage / stats.basic.count) : 0;
  stats.topUsers = [...data].sort((a, b) => b.overallUsage - a.overallUsage).slice(0, 10);
  return stats;
}

function priorityBadgeClass(p: string) {
  return `badge badge-${(p || 'zero').toLowerCase()}`;
}

function downloadCSV(rows: UserData[], filename: string) {
  const headers = ['Email', 'License', 'Priority', 'Overall Usage', 'Active Days', ...SERVICES];
  const lines = rows.map((u) =>
    [
      u.email,
      u.hasGeminiPro ? 'Pro' : 'Basic',
      u.overallUsagePriority,
      u.overallUsage,
      u.activeDays,
      ...SERVICES.map((s) => u.services[s]),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [headers.map((h) => `"${h}"`).join(','), ...lines].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function OverviewClient() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [divisionSummary, setDivisionSummary] = useState<DivisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showUntracked, setShowUntracked] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/usage').then((r) => r.json()),
      fetch('/api/students').then((r) => r.json()),
      fetch('/api/divisions').then((r) => r.json()),
    ])
      .then(([usage, students, divisions]) => {
        if (usage.error) {
          setError(usage.error);
          return;
        }
        setUsageData(usage);
        setStudentData(students);
        setDivisionSummary(divisions);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useCallback((): UserData[] => {
    if (!usageData) return [];
    return usageData.users.filter((u) => {
      if (quickFilter === 'pro' && !u.hasGeminiPro) return false;
      if (quickFilter === 'basic' && (!u.isStaff || u.hasGeminiPro)) return false;
      if (quickFilter === 'non-active-staff') {
        if (u.isStudent || !u.isStaff) return false;
        if (u.overallUsagePriority !== 'Zero' && u.activeDays !== 0) return false;
      }
      if (quickFilter === 'students' && !u.isStudent) return false;
      if (priorityFilter !== 'all' && u.overallUsagePriority !== priorityFilter) return false;
      if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (usageFilter !== 'all') {
        const p = u.overallUsagePriority;
        if (usageFilter === 'low-and-above' && p === 'Zero') return false;
        if (usageFilter === 'medium-and-above' && (p === 'Zero' || p === 'Low')) return false;
        if (usageFilter === 'high-only' && p !== 'High') return false;
      }
      if (serviceFilter !== 'all' && u.services[serviceFilter as ServiceName] === 0) return false;
      return true;
    });
  }, [usageData, quickFilter, priorityFilter, search, usageFilter, serviceFilter]);

  if (loading) return <div className="loading">Loading dashboard data...</div>;
  if (error)
    return (
      <div className="no-data">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  if (!usageData) return null;

  const filtered = filteredData();
  const stats = calcStats(filtered);

  const divColors = {
    'Elementary School': 'division-es',
    'Middle School': 'division-ms',
    'High School': 'division-hs',
  } as Record<string, string>;

  return (
    <>
      {/* Stat cards */}
      <div className="stats-grid">
        {[
          { cls: 'total', label: 'Total Users', value: stats.total, sub: '' },
          {
            cls: 'pro',
            label: 'Gemini Pro Users',
            value: stats.geminiPro.count,
            sub: `Avg: ${stats.geminiPro.avgUsage.toLocaleString()}`,
          },
          {
            cls: 'basic',
            label: 'Basic/No Pro Users',
            value: stats.basic.count,
            sub: `Avg: ${stats.basic.avgUsage.toLocaleString()}`,
          },
          {
            cls: 'high',
            label: 'High Priority',
            value: stats.priority.High.count,
            sub: `Pro: ${stats.priority.High.pro} | Basic: ${stats.priority.High.basic}`,
          },
          {
            cls: 'medium',
            label: 'Medium Priority',
            value: stats.priority.Medium.count,
            sub: `Pro: ${stats.priority.Medium.pro} | Basic: ${stats.priority.Medium.basic}`,
          },
          {
            cls: 'low',
            label: 'Low Priority',
            value: stats.priority.Low.count,
            sub: `Pro: ${stats.priority.Low.pro} | Basic: ${stats.priority.Low.basic}`,
          },
          {
            cls: 'zero',
            label: 'Zero Priority',
            value: stats.priority.Zero.count,
            sub: `Pro: ${stats.priority.Zero.pro} | Basic: ${stats.priority.Zero.basic}`,
          },
          {
            cls: 'usage',
            label: 'Total Usage',
            value: stats.totalUsage.toLocaleString(),
            sub: `Avg: ${stats.avgUsage.toLocaleString()}`,
          },
        ].map((c) => (
          <div key={c.label} className={`stat-card ${c.cls}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            {c.sub && <div className="stat-subtext">{c.sub}</div>}
          </div>
        ))}
        {studentData && (
          <div className="stat-card total">
            <div className="stat-label">Students With Gemini</div>
            <div className="stat-value">{studentData.withAccess.total}</div>
          </div>
        )}
        {usageData.studentsNoGeminiCount > 0 && (
          <div className="stat-card" style={{ borderLeftColor: '#6d6f72' }}>
            <div className="stat-label">Students Without Gemini</div>
            <div className="stat-value">{usageData.studentsNoGeminiCount}</div>
            <div className="stat-subtext">Excluded from metrics</div>
          </div>
        )}
        {usageData.untrackedUsers.count > 0 && (
          <div
            className="stat-card"
            style={{ borderLeftColor: '#ff9800', cursor: 'pointer' }}
            onClick={() => setShowUntracked(true)}
          >
            <div className="stat-label">Untracked Users</div>
            <div className="stat-value">{usageData.untrackedUsers.count}</div>
            <div className="stat-subtext">Not in any known list</div>
          </div>
        )}
      </div>

      {/* Division summary */}
      {divisionSummary?.divisions && (
        <div className="stats-grid">
          {Object.entries(divisionSummary.divisions).map(([name, d]) => (
            <Link key={name} href="/divisions" style={{ textDecoration: 'none' }}>
              <div
                className={`stat-card ${divColors[name] ?? 'division-admin'}`}
                style={{ cursor: 'pointer' }}
              >
                <div className="stat-label">{name}</div>
                <div className="stat-value">{d.userCount}</div>
                <div className="stat-subtext">
                  Pro: {d.proCount} | Avg Days: {d.avgActiveDays}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        {(['all', 'pro', 'basic', 'non-active-staff', 'students'] as QuickFilter[]).map((f) => {
          const labels: Record<QuickFilter, string> = {
            all: 'All Users',
            pro: 'AI Pro Users',
            basic: 'Basic Only',
            'non-active-staff': 'Non-Active Staff',
            students: 'Students',
          };
          return (
            <button
              key={f}
              className={`quick-filter-btn${quickFilter === f ? ' active' : ''}`}
              onClick={() => setQuickFilter(f)}
            >
              {labels[f]}
            </button>
          );
        })}
        <div className="filter-separator" />
        <div className="filter-group">
          <label>Service</label>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="all">All</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Priority</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All</option>
            {['High', 'Medium', 'Low', 'Zero'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Min Level</label>
          <select value={usageFilter} onChange={(e) => setUsageFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="low-and-above">Low+</option>
            <option value="medium-and-above">Med+</option>
            <option value="high-only">High</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Search</label>
          <input
            className="search-input"
            type="text"
            placeholder="Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <section>
            <div className="chart-title">Priority Distribution</div>
            <div className="chart-wrapper">
              <Doughnut
                data={{
                  labels: ['High', 'Medium', 'Low', 'Zero'],
                  datasets: [
                    {
                      data: [
                        stats.priority.High.count,
                        stats.priority.Medium.count,
                        stats.priority.Low.count,
                        stats.priority.Zero.count,
                      ],
                      backgroundColor: [
                        PRIORITY_COLORS.High,
                        PRIORITY_COLORS.Medium,
                        PRIORITY_COLORS.Low,
                        PRIORITY_COLORS.Zero,
                      ],
                      borderWidth: 2,
                      borderColor: '#fff',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          </section>
        </div>
        <div className="card">
          <section>
            <div className="chart-title">Priority: Pro vs Basic</div>
            <div className="chart-wrapper">
              <Bar
                data={{
                  labels: ['High', 'Medium', 'Low', 'Zero'],
                  datasets: [
                    {
                      label: 'Pro',
                      data: [
                        stats.priority.High.pro,
                        stats.priority.Medium.pro,
                        stats.priority.Low.pro,
                        stats.priority.Zero.pro,
                      ],
                      backgroundColor: CHART_COLORS.purple,
                    },
                    {
                      label: 'Basic',
                      data: [
                        stats.priority.High.basic,
                        stats.priority.Medium.basic,
                        stats.priority.Low.basic,
                        stats.priority.Zero.basic,
                      ],
                      backgroundColor: CHART_COLORS.gray,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <section>
            <div className="chart-title">License Distribution</div>
            <div className="chart-wrapper">
              <Doughnut
                data={{
                  labels: ['Gemini Pro', 'Basic'],
                  datasets: [
                    {
                      data: [stats.geminiPro.count, stats.basic.count],
                      backgroundColor: [CHART_COLORS.purple, CHART_COLORS.gray],
                      borderWidth: 2,
                      borderColor: '#fff',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          </section>
        </div>
        <div className="card">
          <section>
            <div className="chart-title">Gemini Usage: Pro vs Basic</div>
            <div className="chart-wrapper">
              <Bar
                data={{
                  labels: ['Pro Users', 'Basic Users'],
                  datasets: [
                    {
                      label: 'Gemini Usage',
                      data: [stats.geminiPro.geminiUsage, stats.basic.geminiUsage],
                      backgroundColor: [CHART_COLORS.purple, CHART_COLORS.gray],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <section>
            <div className="chart-title">Service Usage</div>
            <div className="chart-wrapper">
              <Doughnut
                data={{
                  labels: SERVICES as unknown as string[],
                  datasets: [
                    {
                      data: SERVICES.map((s) => stats.services[s].total),
                      backgroundColor: SERVICE_COLORS,
                      borderWidth: 2,
                      borderColor: '#fff',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right' } },
                }}
              />
            </div>
          </section>
        </div>
        <div className="card">
          <section>
            <div className="chart-title">Pro vs Basic by Service</div>
            <div className="chart-wrapper">
              <Bar
                data={{
                  labels: SERVICES as unknown as string[],
                  datasets: [
                    {
                      label: 'Pro',
                      data: SERVICES.map((s) => stats.services[s].pro),
                      backgroundColor: CHART_COLORS.purple,
                    },
                    {
                      label: 'Basic',
                      data: SERVICES.map((s) => stats.services[s].basic),
                      backgroundColor: CHART_COLORS.gray,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <section>
            <div className="chart-title">Top 10 Users</div>
            <div className="chart-wrapper tall">
              <Bar
                data={{
                  labels: stats.topUsers.map((u) =>
                    u.hasGeminiPro ? `${u.email.split('@')[0]} *` : u.email.split('@')[0]
                  ),
                  datasets: [
                    {
                      label: 'Usage',
                      data: stats.topUsers.map((u) => u.overallUsage),
                      backgroundColor: stats.topUsers.map((u) =>
                        u.hasGeminiPro ? CHART_COLORS.purple : CHART_COLORS.gray
                      ),
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true } },
                }}
              />
            </div>
          </section>
        </div>
        <div className="card">
          <section>
            <div className="chart-title">Usage vs Active Days</div>
            <div className="chart-wrapper tall">
              <Scatter
                data={{
                  datasets: [
                    {
                      label: 'Pro',
                      data: filtered
                        .filter((u) => u.hasGeminiPro)
                        .map((u) => ({ x: u.activeDays, y: u.overallUsage })),
                      backgroundColor: CHART_COLORS.purple,
                      pointRadius: 5,
                    },
                    {
                      label: 'Basic',
                      data: filtered
                        .filter((u) => !u.hasGeminiPro)
                        .map((u) => ({ x: u.activeDays, y: u.overallUsage })),
                      backgroundColor: CHART_COLORS.gray,
                      pointRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                  scales: {
                    x: { title: { display: true, text: 'Active Days' }, beginAtZero: true },
                    y: { title: { display: true, text: 'Overall Usage' }, beginAtZero: true },
                  },
                }}
              />
            </div>
          </section>
        </div>
      </div>

      {/* User table */}
      <div className="card">
        <header>
          <h2>User Data ({filtered.length} users)</h2>
          <button className="btn" onClick={() => downloadCSV(filtered, 'sas-usage-analytics.csv')}>
            Export CSV
          </button>
        </header>
        <section>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>License</th>
                  <th>Priority</th>
                  <th>Active Days</th>
                  {SERVICES.map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered]
                  .sort((a, b) => b.overallUsage - a.overallUsage)
                  .map((u, i) => {
                    const isUntracked = usageData.untrackedUsers.users.some(
                      (x) => x.email.toLowerCase() === u.email.toLowerCase()
                    );
                    return (
                      <tr key={u.email}>
                        <td>{i + 1}</td>
                        <td>
                          <Link
                            href={`/user?email=${encodeURIComponent(u.email)}`}
                            className="email-link"
                          >
                            {u.email}
                          </Link>
                        </td>
                        <td>
                          <span
                            className={u.hasGeminiPro ? 'badge badge-pro' : 'badge badge-basic'}
                          >
                            {u.hasGeminiPro ? 'Pro' : 'Basic'}
                          </span>
                          {isUntracked && (
                            <span className="badge badge-untracked" style={{ marginLeft: 4 }}>
                              Untracked
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={priorityBadgeClass(u.overallUsagePriority)}>
                            {u.overallUsagePriority}
                          </span>
                          <span className="usage-value"> ({u.overallUsage.toLocaleString()})</span>
                        </td>
                        <td>{u.activeDays}</td>
                        {SERVICES.map((s) => (
                          <td key={s}>
                            <span className={priorityBadgeClass(u.servicesPriority[s])}>
                              {u.servicesPriority[s]}
                            </span>{' '}
                            <span className="usage-value">({u.services[s].toLocaleString()})</span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Untracked users modal */}
      {showUntracked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowUntracked(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 30,
              maxWidth: 600,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 16, color: '#1a2d58' }}>
              Untracked Users ({usageData.untrackedUsers.count})
            </h2>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Priority</th>
                  <th>Usage</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                {[...usageData.untrackedUsers.users]
                  .sort((a, b) => b.overallUsage - a.overallUsage)
                  .map((u, i) => (
                    <tr key={u.email}>
                      <td>{i + 1}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={priorityBadgeClass(u.priority)}>{u.priority}</span>
                      </td>
                      <td>{u.overallUsage.toLocaleString()}</td>
                      <td>{u.activeDays}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <button
              className="btn"
              style={{ marginTop: 16 }}
              onClick={() => setShowUntracked(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
