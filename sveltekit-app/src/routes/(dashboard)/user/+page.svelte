<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { SERVICES } from '$lib/types';
  import {
    Chart,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
  } from 'chart.js';

  Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

  let { data }: { data: PageData } = $props();

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

  function downloadCSV() {
    if (!data.profile) return;
    const rows = SERVICES.map((s) => ({
      service: s,
      usage: data.profile!.services[s],
      priority: data.profile!.servicesPriority[s],
    }));
    const header = '"Service","Usage Count","Priority"';
    const lines = rows.map((r) => `"${r.service}","${r.usage}","${r.priority}"`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[header, ...lines].join('\n')], { type: 'text/csv' }));
    a.download = `sas-profile-${data.profile!.email.split('@')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  let serviceCanvas = $state<HTMLCanvasElement>(null!);
  let comparisonCanvas = $state<HTMLCanvasElement>(null!);
  let charts: Chart[] = [];

  function destroyCharts() {
    charts.forEach((c) => c.destroy());
    charts = [];
  }

  onMount(() => {
    if (!data.profile) return;
    const p = data.profile;

    charts.push(
      new Chart(serviceCanvas, {
        type: 'bar',
        data: {
          labels: [...SERVICES],
          datasets: [
            {
              label: 'Usage Count',
              data: SERVICES.map((s) => p.services[s]),
              backgroundColor: SERVICE_COLORS,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } },
        },
      })
    );

    if (p.divisionAvg.activeDays !== undefined && comparisonCanvas) {
      charts.push(
        new Chart(comparisonCanvas, {
          type: 'bar',
          data: {
            labels: ['Active Days'],
            datasets: [
              {
                label: p.name || 'You',
                data: [p.activeDays],
                backgroundColor: p.hasGeminiPro ? CHART_COLORS.purple : CHART_COLORS.blue,
              },
              {
                label: `${p.division || 'Division'} Average`,
                data: [p.divisionAvg.activeDays],
                backgroundColor: CHART_COLORS.gray,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } },
          },
        })
      );
    }

    return destroyCharts;
  });
</script>

<svelte:head>
  <title
    >{data.profile ? data.profile.name || data.profile.email : 'User Profile'} — Gemini Usage Tracker</title
  >
</svelte:head>

<a href="/" class="back-btn">← Back to Overview</a>

{#if !data.email}
  <div class="no-data">
    <h2>No email specified</h2>
    <p>Navigate from the Overview page.</p>
  </div>
{:else if !data.profile}
  <div class="no-data">
    <h2>User not found</h2>
    <p>{data.email}</p>
  </div>
{:else}
  {@const p = data.profile}

  <div class="profile-header">
    <div class="profile-avatar">{getInitials(p.name || p.email)}</div>
    <div class="profile-info">
      <h2>{p.name || p.email}</h2>
      <p>{p.email}</p>
      {#if p.division}<p>{p.division}{p.jobTitle ? ` — ${p.jobTitle}` : ''}</p>{/if}
    </div>
    <div style="margin-left:auto;text-align:right;">
      <span
        class={p.hasGeminiPro ? 'badge badge-pro' : 'badge badge-basic'}
        style="font-size:14px;padding:6px 16px;"
      >
        {p.hasGeminiPro ? 'Gemini Pro' : 'Basic'}
      </span>
      {#if p.personId}<div style="margin-top:8px;font-size:12px;color:#999;">
          ID: {p.personId}
        </div>{/if}
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card {(p.overallPriority || 'zero').toLowerCase()}">
      <div class="stat-label">Overall Priority</div>
      <div class="stat-value">
        <span class={priorityBadgeClass(p.overallPriority)} style="font-size:18px;padding:6px 16px;"
          >{p.overallPriority}</span
        >
      </div>
    </div>
    <div class="stat-card usage">
      <div class="stat-label">Overall Usage</div>
      <div class="stat-value">{p.overallUsage.toLocaleString()}</div>
    </div>
    <div class="stat-card total">
      <div class="stat-label">Active Days</div>
      <div class="stat-value">{p.activeDays}</div>
      {#if p.divisionAvg.activeDays !== undefined}
        <div class="stat-subtext">Division avg: {p.divisionAvg.activeDays}</div>
      {/if}
    </div>
    {#if p.divisionAvg.userCount > 0}
      <div class="stat-card basic">
        <div class="stat-label">Division Size</div>
        <div class="stat-value">{p.divisionAvg.userCount}</div>
        <div class="stat-subtext">{p.division}</div>
      </div>
    {/if}
  </div>

  <div class="charts-grid">
    <div class="card">
      <section>
        <div class="chart-title">Service Usage Breakdown</div>
        <div class="chart-wrapper tall"><canvas bind:this={serviceCanvas}></canvas></div>
      </section>
    </div>
    <div class="card">
      <section>
        <div class="chart-title">Service Priority Labels</div>
        <div
          class="chart-wrapper tall"
          style="display:flex;align-items:center;justify-content:center;"
        >
          <table style="width:100%;font-size:14px;">
            <tbody>
              {#each SERVICES as svc}
                <tr>
                  <td style="padding:10px 15px;font-weight:600;">{svc}</td>
                  <td style="padding:10px 15px;"
                    ><span class={priorityBadgeClass(p.servicesPriority[svc] ?? 'Zero')}
                      >{p.servicesPriority[svc] ?? 'Zero'}</span
                    ></td
                  >
                  <td style="padding:10px 15px;text-align:right;color:#1a2d58;font-weight:600;"
                    >{(p.services[svc] ?? 0).toLocaleString()}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>

  {#if p.divisionAvg.activeDays !== undefined}
    <div class="charts-grid">
      <div class="card">
        <section>
          <div class="chart-title">You vs {p.division || 'Division'} Average</div>
          <div class="chart-wrapper"><canvas bind:this={comparisonCanvas}></canvas></div>
        </section>
      </div>
    </div>
  {/if}

  <div class="card">
    <header>
      <h2>Service Details</h2>
      <button class="btn" onclick={downloadCSV}>Export CSV</button>
    </header>
    <section>
      <div class="table-scroll">
        <table class="table">
          <thead><tr><th>Service</th><th>Usage Count</th><th>Priority</th></tr></thead>
          <tbody>
            {#each SERVICES as svc}
              <tr>
                <td><strong>{svc}</strong></td>
                <td class="usage-value">{(p.services[svc] ?? 0).toLocaleString()}</td>
                <td
                  ><span class={priorityBadgeClass(p.servicesPriority[svc] ?? 'Zero')}
                    >{p.servicesPriority[svc] ?? 'Zero'}</span
                  ></td
                >
              </tr>
            {/each}
            <tr style="border-top:2px solid #1a2d58;font-weight:700;">
              <td>Total</td>
              <td class="usage-value">{p.overallUsage.toLocaleString()}</td>
              <td><span class={priorityBadgeClass(p.overallPriority)}>{p.overallPriority}</span></td
              >
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
{/if}
