'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { UserProfile } from '@/types';
import { SERVICES } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CHART_COLORS = { purple: '#c42384', gray: '#97999c', blue: '#1a2d58' };
const SERVICE_COLORS = [
  '#ee7103',
  '#1a2d58',
  '#009754',
  '#e6413d',
  '#1284ad',
  '#c42384',
  '#fdc013',
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function priorityBadgeClass(p: string) {
  return `badge badge-${(p || 'zero').toLowerCase()}`;
}

function downloadCSV(profile: UserProfile) {
  const rows = SERVICES.map((s) => ({
    service: s,
    usage: profile.services[s],
    priority: profile.servicesPriority[s],
  }));
  const header = '"Service","Usage Count","Priority"';
  const lines = rows.map((r) => `"${r.service}","${r.usage}","${r.priority}"`);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([[header, ...lines].join('\n')], { type: 'text/csv' }));
  a.download = `sas-profile-${profile.email.split('@')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function UserProfileClient() {
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    fetch(`/api/user?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProfile(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [email]);

  if (!email)
    return (
      <div className="no-data">
        <h2>No email specified</h2>
        <p>Navigate from the Overview page.</p>
      </div>
    );
  if (loading) return <div className="loading">Loading user profile...</div>;
  if (error)
    return (
      <div className="no-data">
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
      </div>
    );
  if (!profile)
    return (
      <div className="no-data">
        <h2>User not found</h2>
        <p>{email}</p>
      </div>
    );

  const svcData = SERVICES.map((s) => profile.services[s]);

  return (
    <>
      <Link href="/" className="back-btn">
        ← Back to Overview
      </Link>

      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar">{getInitials(profile.name || profile.email)}</div>
        <div className="profile-info">
          <h2>{profile.name || profile.email}</h2>
          <p>{profile.email}</p>
          {profile.division && (
            <p>
              {profile.division}
              {profile.jobTitle ? ` — ${profile.jobTitle}` : ''}
            </p>
          )}
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span
            className={profile.hasGeminiPro ? 'badge badge-pro' : 'badge badge-basic'}
            style={{ fontSize: 14, padding: '6px 16px' }}
          >
            {profile.hasGeminiPro ? 'Gemini Pro' : 'Basic'}
          </span>
          {profile.personId && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>ID: {profile.personId}</div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className={`stat-card ${(profile.overallPriority || 'zero').toLowerCase()}`}>
          <div className="stat-label">Overall Priority</div>
          <div className="stat-value">
            <span
              className={priorityBadgeClass(profile.overallPriority)}
              style={{ fontSize: 18, padding: '6px 16px' }}
            >
              {profile.overallPriority}
            </span>
          </div>
        </div>
        <div className="stat-card usage">
          <div className="stat-label">Overall Usage</div>
          <div className="stat-value">{profile.overallUsage.toLocaleString()}</div>
        </div>
        <div className="stat-card total">
          <div className="stat-label">Active Days</div>
          <div className="stat-value">{profile.activeDays}</div>
          {profile.divisionAvg.activeDays !== undefined && (
            <div className="stat-subtext">Division avg: {profile.divisionAvg.activeDays}</div>
          )}
        </div>
        {profile.divisionAvg.userCount > 0 && (
          <div className="stat-card basic">
            <div className="stat-label">Division Size</div>
            <div className="stat-value">{profile.divisionAvg.userCount}</div>
            <div className="stat-subtext">{profile.division}</div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <section>
            <div className="chart-title">Service Usage Breakdown</div>
            <div className="chart-wrapper tall">
              <Bar
                data={{
                  labels: SERVICES as unknown as string[],
                  datasets: [
                    { label: 'Usage Count', data: svcData, backgroundColor: SERVICE_COLORS },
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
            <div className="chart-title">Service Priority Labels</div>
            <div
              className="chart-wrapper tall"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <table style={{ width: '100%', fontSize: 14 }}>
                <tbody>
                  {SERVICES.map((svc) => (
                    <tr key={svc}>
                      <td style={{ padding: '10px 15px', fontWeight: 600 }}>{svc}</td>
                      <td style={{ padding: '10px 15px' }}>
                        <span
                          className={priorityBadgeClass(profile.servicesPriority[svc] ?? 'Zero')}
                        >
                          {profile.servicesPriority[svc] ?? 'Zero'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '10px 15px',
                          textAlign: 'right',
                          color: '#1a2d58',
                          fontWeight: 600,
                        }}
                      >
                        {(profile.services[svc] ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {profile.divisionAvg.activeDays !== undefined && (
        <div className="charts-grid">
          <div className="card">
            <section>
              <div className="chart-title">You vs {profile.division || 'Division'} Average</div>
              <div className="chart-wrapper">
                <Bar
                  data={{
                    labels: ['Active Days'],
                    datasets: [
                      {
                        label: profile.name || 'You',
                        data: [profile.activeDays],
                        backgroundColor: profile.hasGeminiPro
                          ? CHART_COLORS.purple
                          : CHART_COLORS.blue,
                      },
                      {
                        label: `${profile.division || 'Division'} Average`,
                        data: [profile.divisionAvg.activeDays],
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
      )}

      {/* Service details table */}
      <div className="card">
        <header>
          <h2>Service Details</h2>
          <button className="btn" onClick={() => downloadCSV(profile)}>
            Export CSV
          </button>
        </header>
        <section>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Usage Count</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((svc) => (
                  <tr key={svc}>
                    <td>
                      <strong>{svc}</strong>
                    </td>
                    <td className="usage-value">{(profile.services[svc] ?? 0).toLocaleString()}</td>
                    <td>
                      <span className={priorityBadgeClass(profile.servicesPriority[svc] ?? 'Zero')}>
                        {profile.servicesPriority[svc] ?? 'Zero'}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #1a2d58', fontWeight: 700 }}>
                  <td>Total</td>
                  <td className="usage-value">{profile.overallUsage.toLocaleString()}</td>
                  <td>
                    <span className={priorityBadgeClass(profile.overallPriority)}>
                      {profile.overallPriority}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
