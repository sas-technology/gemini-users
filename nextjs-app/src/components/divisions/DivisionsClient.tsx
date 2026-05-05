'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import type { DivisionData, Division, DivisionUser, UsagePriority } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CHART_COLORS = {
  red: '#a0192a',
  orange: '#ee7103',
  yellow: '#fabc00',
  green: '#009754',
  purple: '#c42384',
  gray: '#97999c',
  blue: '#1a2d58',
};
const PRIORITY_COLORS = { High: '#ff0000', Medium: '#ff9900', Low: '#ffcc00', Zero: '#28a745' };
const DIVISION_COLORS: Record<string, string> = {
  'Elementary School': '#228ec2',
  'Middle School': '#a0192a',
  'High School': '#1a2d58',
  Admin: '#6d6f72',
};

function divCssClass(name: string) {
  return (
    (
      {
        'Elementary School': 'division-es',
        'Middle School': 'division-ms',
        'High School': 'division-hs',
      } as Record<string, string>
    )[name] ?? 'division-admin'
  );
}

function downloadCSV(
  rows: object[],
  cols: { key: string | ((r: Record<string, unknown>) => unknown); label: string }[],
  filename: string
) {
  const header = cols.map((c) => `"${c.label}"`).join(',');
  const lines = (rows as Record<string, unknown>[]).map((r) =>
    cols
      .map((c) => {
        const v = typeof c.key === 'function' ? c.key(r) : r[c.key];
        return `"${String(v ?? '').replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([[header, ...lines].join('\n')], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function DivisionsClient() {
  const [divisionData, setDivisionData] = useState<DivisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('compare');

  useEffect(() => {
    fetch('/api/divisions')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setDivisionData(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading division data...</div>;
  if (error)
    return (
      <div className="no-data">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  if (!divisionData?.divisions)
    return (
      <div className="no-data">
        <h2>No division data available</h2>
      </div>
    );

  const divNames = Object.keys(divisionData.divisions).sort();
  const activeDiv = divNames.find((n) => n.replace(/\s+/g, '-').toLowerCase() === activeTab);

  return (
    <>
      <h1 className="page-title">Division Analytics</h1>
      <div className="sas-tabs">
        <nav role="tablist" aria-orientation="horizontal">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'compare'}
            onClick={() => setActiveTab('compare')}
          >
            Compare All
          </button>
          {divNames.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={activeTab === name.replace(/\s+/g, '-').toLowerCase()}
              onClick={() => setActiveTab(name.replace(/\s+/g, '-').toLowerCase())}
            >
              {name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'compare' ? (
        <CompareView divNames={divNames} divisions={divisionData.divisions} />
      ) : activeDiv ? (
        <DivisionView name={activeDiv} div={divisionData.divisions[activeDiv]} />
      ) : (
        <div className="no-data">
          <h2>Division not found</h2>
        </div>
      )}
    </>
  );
}

function CompareView({
  divNames,
  divisions,
}: {
  divNames: string[];
  divisions: Record<string, Division>;
}) {
  const colors = divNames.map((n) => DIVISION_COLORS[n] ?? '#6d6f72');

  return (
    <>
      <div className="stats-grid">
        {divNames.map((name) => {
          const d = divisions[name];
          const rate = d.userCount > 0 ? Math.round((d.proCount / d.userCount) * 100) : 0;
          return (
            <div key={name} className={`stat-card ${divCssClass(name)}`}>
              <div className="stat-label">{name}</div>
              <div className="stat-value">
                {d.userCount} <span style={{ fontSize: 14, color: '#888' }}>users</span>
              </div>
              <div className="stat-subtext">
                Pro: {d.proCount} ({rate}%) | Avg Days: {d.avgActiveDays}
              </div>
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <div className="card">
          <section>
            <div className="chart-title">User Count by Division</div>
            <div className="chart-wrapper">
              <Bar
                data={{
                  labels: divNames,
                  datasets: [
                    {
                      label: 'Total Users',
                      data: divNames.map((n) => divisions[n].userCount),
                      backgroundColor: colors,
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
        <div className="card">
          <section>
            <div className="chart-title">Gemini Pro Adoption Rate</div>
            <div className="chart-wrapper">
              <Bar
                data={{
                  labels: divNames,
                  datasets: [
                    {
                      label: 'Pro Users',
                      data: divNames.map((n) => divisions[n].proCount),
                      backgroundColor: CHART_COLORS.purple,
                      stack: 's',
                    },
                    {
                      label: 'Basic Users',
                      data: divNames.map((n) => divisions[n].userCount - divisions[n].proCount),
                      backgroundColor: CHART_COLORS.gray,
                      stack: 's',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { y: { beginAtZero: true, stacked: true }, x: { stacked: true } },
                }}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <section>
            <div className="chart-title">Priority Distribution by Division</div>
            <div className="chart-wrapper tall">
              <Bar
                data={{
                  labels: divNames,
                  datasets: (['High', 'Medium', 'Low', 'Zero'] as UsagePriority[]).map((p) => ({
                    label: p,
                    data: divNames.map((n) => divisions[n].priorityBreakdown[p]),
                    backgroundColor: PRIORITY_COLORS[p],
                  })),
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
        <div className="card">
          <section>
            <div className="chart-title">Average Active Days by Division</div>
            <div className="chart-wrapper">
              <Bar
                data={{
                  labels: divNames,
                  datasets: [
                    {
                      label: 'Avg Active Days',
                      data: divNames.map((n) => divisions[n].avgActiveDays),
                      backgroundColor: colors,
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

      <div className="card">
        <header>
          <h2>Division Summary</h2>
          <button
            className="btn"
            onClick={() => {
              const rows = divNames.map((n) => {
                const d = divisions[n];
                return {
                  division: n,
                  userCount: d.userCount,
                  proCount: d.proCount,
                  adoptionRate: d.userCount > 0 ? Math.round((d.proCount / d.userCount) * 100) : 0,
                  avgActiveDays: d.avgActiveDays,
                  high: d.priorityBreakdown.High,
                  medium: d.priorityBreakdown.Medium,
                  low: d.priorityBreakdown.Low,
                  zero: d.priorityBreakdown.Zero,
                };
              });
              downloadCSV(
                rows,
                [
                  { key: 'division', label: 'Division' },
                  { key: 'userCount', label: 'Users' },
                  { key: 'proCount', label: 'Pro Users' },
                  { key: 'adoptionRate', label: 'Adoption Rate (%)' },
                  { key: 'avgActiveDays', label: 'Avg Active Days' },
                  { key: 'high', label: 'High' },
                  { key: 'medium', label: 'Medium' },
                  { key: 'low', label: 'Low' },
                  { key: 'zero', label: 'Zero' },
                ],
                'sas-division-summary.csv'
              );
            }}
          >
            Export CSV
          </button>
        </header>
        <section>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Division</th>
                  <th>Users</th>
                  <th>Pro Users</th>
                  <th>Adoption Rate</th>
                  <th>Avg Active Days</th>
                  <th>High</th>
                  <th>Medium</th>
                  <th>Low</th>
                  <th>Zero</th>
                </tr>
              </thead>
              <tbody>
                {divNames.map((name) => {
                  const d = divisions[name];
                  const rate = d.userCount > 0 ? Math.round((d.proCount / d.userCount) * 100) : 0;
                  return (
                    <tr key={name}>
                      <td>
                        <strong>{name}</strong>
                      </td>
                      <td>{d.userCount}</td>
                      <td>{d.proCount}</td>
                      <td>{rate}%</td>
                      <td>{d.avgActiveDays}</td>
                      <td>
                        <span className="badge badge-high">{d.priorityBreakdown.High}</span>
                      </td>
                      <td>
                        <span className="badge badge-medium">{d.priorityBreakdown.Medium}</span>
                      </td>
                      <td>
                        <span className="badge badge-low">{d.priorityBreakdown.Low}</span>
                      </td>
                      <td>
                        <span className="badge badge-zero">{d.priorityBreakdown.Zero}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function DivisionView({ name, div }: { name: string; div: Division }) {
  const adoptionRate = div.userCount > 0 ? Math.round((div.proCount / div.userCount) * 100) : 0;
  const sorted = [...div.users].sort((a, b) => b.activeDays - a.activeDays);

  return (
    <>
      <div className="stats-grid">
        <div className={`stat-card ${divCssClass(name)}`}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{div.userCount}</div>
        </div>
        <div className="stat-card pro">
          <div className="stat-label">Gemini Pro</div>
          <div className="stat-value">{div.proCount}</div>
          <div className="stat-subtext">{adoptionRate}% adoption</div>
        </div>
        <div className="stat-card basic">
          <div className="stat-label">Basic</div>
          <div className="stat-value">{div.userCount - div.proCount}</div>
        </div>
        <div className="stat-card usage">
          <div className="stat-label">Avg Active Days</div>
          <div className="stat-value">{div.avgActiveDays}</div>
        </div>
      </div>

      <div className="stats-grid">
        {(['High', 'Medium', 'Low', 'Zero'] as UsagePriority[]).map((p) => {
          const count = div.priorityBreakdown[p];
          const pct = div.userCount > 0 ? Math.round((count / div.userCount) * 100) : 0;
          return (
            <div key={p} className={`stat-card ${p.toLowerCase()}`}>
              <div className="stat-label">{p} Priority</div>
              <div className="stat-value">{count}</div>
              <div className="stat-subtext">{pct}% of division</div>
            </div>
          );
        })}
      </div>

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
                        div.priorityBreakdown.High,
                        div.priorityBreakdown.Medium,
                        div.priorityBreakdown.Low,
                        div.priorityBreakdown.Zero,
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
            <div className="chart-title">License Breakdown</div>
            <div className="chart-wrapper">
              <Doughnut
                data={{
                  labels: ['Gemini Pro', 'Basic'],
                  datasets: [
                    {
                      data: [div.proCount, div.userCount - div.proCount],
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
      </div>

      {div.topUsers.length > 0 && (
        <div className="charts-grid">
          <div className="card">
            <section>
              <div className="chart-title">Top Users by Active Days</div>
              <div className="chart-wrapper tall">
                <Bar
                  data={{
                    labels: div.topUsers.map((u: DivisionUser) =>
                      u.hasGeminiPro ? `${u.email.split('@')[0]} *` : u.email.split('@')[0]
                    ),
                    datasets: [
                      {
                        label: 'Active Days',
                        data: div.topUsers.map((u: DivisionUser) => u.activeDays),
                        backgroundColor: div.topUsers.map((u: DivisionUser) =>
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
        </div>
      )}

      <div className="card">
        <header>
          <h2>
            {name} Users ({div.users.length})
          </h2>
          <button
            className="btn"
            onClick={() =>
              downloadCSV(
                div.users as unknown as object[],
                [
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'jobTitle', label: 'Job Title' },
                  {
                    key: (r: Record<string, unknown>) => (r.hasGeminiPro ? 'Pro' : 'Basic'),
                    label: 'License',
                  },
                  { key: 'priority', label: 'Priority' },
                  { key: 'activeDays', label: 'Active Days' },
                ],
                `sas-${name.toLowerCase().replace(/\s+/g, '-')}-users.csv`
              )
            }
          >
            Export CSV
          </button>
        </header>
        <section>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Job Title</th>
                  <th>License</th>
                  <th>Priority</th>
                  <th>Active Days</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((u, i) => (
                  <tr key={u.email}>
                    <td>{i + 1}</td>
                    <td>{u.name}</td>
                    <td>
                      <Link
                        href={`/user?email=${encodeURIComponent(u.email)}`}
                        className="email-link"
                      >
                        {u.email}
                      </Link>
                    </td>
                    <td>{u.jobTitle}</td>
                    <td>
                      <span className={u.hasGeminiPro ? 'badge badge-pro' : 'badge badge-basic'}>
                        {u.hasGeminiPro ? 'Pro' : 'Basic'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.priority.toLowerCase()}`}>
                        {u.priority}
                      </span>
                    </td>
                    <td>{u.activeDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
