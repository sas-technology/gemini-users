<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { UserData, UsagePriority, ServiceName } from '$lib/types';
  import { SERVICES } from '$lib/types';
  import { Chart } from '$lib/chartSetup';
  import InsightsPanel from '$lib/components/InsightsPanel.svelte';
  import ChartTakeaway from '$lib/components/ChartTakeaway.svelte';
  import OperationalList from '$lib/components/OperationalList.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';

  let { data }: { data: PageData } = $props();

  type QuickFilter = 'all' | 'pro' | 'basic' | 'non-active-staff' | 'students';

  let quickFilter = $state<QuickFilter>('all');
  let serviceFilter = $state('all');
  let priorityFilter = $state('all');
  let usageFilter = $state('all');
  let search = $state('');
  let showUntracked = $state(false);

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

  const divColors: Record<string, string> = {
    'Elementary School': 'division-es',
    'Middle School': 'division-ms',
    'High School': 'division-hs',
  };

  const QUICK_LABELS: Record<QuickFilter, string> = {
    all: 'All Users',
    pro: 'AI Pro Users',
    basic: 'Basic Only',
    'non-active-staff': 'Non-Active Staff',
    students: 'Students',
  };

  let filtered = $derived.by(() => {
    if (!data.usage) return [];
    return data.usage.users.filter((u: UserData) => {
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
  });

  let stats = $derived.by(() => {
    const s = {
      total: filtered.length,
      totalUsage: 0,
      avgUsage: 0,
      priority: {
        High: { count: 0, pro: 0, basic: 0 },
        Medium: { count: 0, pro: 0, basic: 0 },
        Low: { count: 0, pro: 0, basic: 0 },
        Zero: { count: 0, pro: 0, basic: 0 },
      } as Record<UsagePriority, { count: number; pro: number; basic: number }>,
      geminiPro: { count: 0, totalUsage: 0, avgUsage: 0, geminiUsage: 0 },
      basic: { count: 0, totalUsage: 0, avgUsage: 0, geminiUsage: 0 },
      services: Object.fromEntries(
        SERVICES.map((sv) => [sv, { total: 0, pro: 0, basic: 0 }])
      ) as Record<string, { total: number; pro: number; basic: number }>,
      topUsers: [] as UserData[],
    };
    for (const u of filtered) {
      const usage = u.overallUsage;
      s.totalUsage += usage;
      const p = u.overallUsagePriority;
      s.priority[p].count++;
      if (u.hasGeminiPro) s.priority[p].pro++;
      else s.priority[p].basic++;
      const gUsage = u.services.Gemini;
      if (u.hasGeminiPro) {
        s.geminiPro.count++;
        s.geminiPro.totalUsage += usage;
        s.geminiPro.geminiUsage += gUsage;
      } else {
        s.basic.count++;
        s.basic.totalUsage += usage;
        s.basic.geminiUsage += gUsage;
      }
      for (const svc of SERVICES) {
        const v = u.services[svc];
        s.services[svc].total += v;
        if (v > 0) {
          if (u.hasGeminiPro) s.services[svc].pro++;
          else s.services[svc].basic++;
        }
      }
    }
    s.avgUsage = s.total > 0 ? Math.round(s.totalUsage / s.total) : 0;
    s.geminiPro.avgUsage =
      s.geminiPro.count > 0 ? Math.round(s.geminiPro.totalUsage / s.geminiPro.count) : 0;
    s.basic.avgUsage = s.basic.count > 0 ? Math.round(s.basic.totalUsage / s.basic.count) : 0;
    s.topUsers = [...filtered].sort((a, b) => b.overallUsage - a.overallUsage).slice(0, 10);
    return s;
  });

  let sortedFiltered = $derived(
    [...filtered].sort((a: UserData, b: UserData) => b.overallUsage - a.overallUsage)
  );

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

  // Chart canvas refs
  let priorityDoughnutCanvas = $state<HTMLCanvasElement>(null!);
  let priorityBarCanvas = $state<HTMLCanvasElement>(null!);
  let licenseDoughnutCanvas = $state<HTMLCanvasElement>(null!);
  let geminiBarCanvas = $state<HTMLCanvasElement>(null!);
  let servicesDoughnutCanvas = $state<HTMLCanvasElement>(null!);
  let servicesBarCanvas = $state<HTMLCanvasElement>(null!);
  let topUsersCanvas = $state<HTMLCanvasElement>(null!);
  let scatterCanvas = $state<HTMLCanvasElement>(null!);

  let charts: Chart[] = [];

  function destroyCharts() {
    charts.forEach((c) => c.destroy());
    charts = [];
  }

  function buildCharts() {
    destroyCharts();
    const s = stats;
    const f = filtered;

    charts.push(
      new Chart(priorityDoughnutCanvas, {
        type: 'doughnut',
        data: {
          labels: ['High', 'Medium', 'Low', 'Zero'],
          datasets: [
            {
              data: [
                s.priority.High.count,
                s.priority.Medium.count,
                s.priority.Low.count,
                s.priority.Zero.count,
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
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      })
    );

    charts.push(
      new Chart(priorityBarCanvas, {
        type: 'bar',
        data: {
          labels: ['High', 'Medium', 'Low', 'Zero'],
          datasets: [
            {
              label: 'Pro',
              data: [
                s.priority.High.pro,
                s.priority.Medium.pro,
                s.priority.Low.pro,
                s.priority.Zero.pro,
              ],
              backgroundColor: CHART_COLORS.purple,
            },
            {
              label: 'Basic',
              data: [
                s.priority.High.basic,
                s.priority.Medium.basic,
                s.priority.Low.basic,
                s.priority.Zero.basic,
              ],
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

    charts.push(
      new Chart(licenseDoughnutCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Gemini Pro', 'Basic'],
          datasets: [
            {
              data: [s.geminiPro.count, s.basic.count],
              backgroundColor: [CHART_COLORS.purple, CHART_COLORS.gray],
              borderWidth: 2,
              borderColor: '#fff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      })
    );

    charts.push(
      new Chart(geminiBarCanvas, {
        type: 'bar',
        data: {
          labels: ['Pro Users', 'Basic Users'],
          datasets: [
            {
              label: 'Gemini Usage',
              data: [s.geminiPro.geminiUsage, s.basic.geminiUsage],
              backgroundColor: [CHART_COLORS.purple, CHART_COLORS.gray],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      })
    );

    charts.push(
      new Chart(servicesDoughnutCanvas, {
        type: 'doughnut',
        data: {
          labels: [...SERVICES],
          datasets: [
            {
              data: SERVICES.map((sv) => s.services[sv].total),
              backgroundColor: SERVICE_COLORS,
              borderWidth: 2,
              borderColor: '#fff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } },
        },
      })
    );

    charts.push(
      new Chart(servicesBarCanvas, {
        type: 'bar',
        data: {
          labels: [...SERVICES],
          datasets: [
            {
              label: 'Pro',
              data: SERVICES.map((sv) => s.services[sv].pro),
              backgroundColor: CHART_COLORS.purple,
            },
            {
              label: 'Basic',
              data: SERVICES.map((sv) => s.services[sv].basic),
              backgroundColor: CHART_COLORS.gray,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true } },
        },
      })
    );

    charts.push(
      new Chart(topUsersCanvas, {
        type: 'bar',
        data: {
          labels: s.topUsers.map((u) =>
            u.hasGeminiPro ? `${u.email.split('@')[0]} *` : u.email.split('@')[0]
          ),
          datasets: [
            {
              label: 'Usage',
              data: s.topUsers.map((u) => u.overallUsage),
              backgroundColor: s.topUsers.map((u) =>
                u.hasGeminiPro ? CHART_COLORS.purple : CHART_COLORS.gray
              ),
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

    charts.push(
      new Chart(scatterCanvas, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Pro',
              data: f
                .filter((u) => u.hasGeminiPro)
                .map((u) => ({ x: u.activeDays, y: u.overallUsage })),
              backgroundColor: CHART_COLORS.purple,
              pointRadius: 5,
            },
            {
              label: 'Basic',
              data: f
                .filter((u) => !u.hasGeminiPro)
                .map((u) => ({ x: u.activeDays, y: u.overallUsage })),
              backgroundColor: CHART_COLORS.gray,
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: {
            x: { title: { display: true, text: 'Active Days' }, beginAtZero: true },
            y: { title: { display: true, text: 'Overall Usage' }, beginAtZero: true },
          },
        },
      })
    );
  }

  onMount(() => {
    buildCharts();
    return destroyCharts;
  });

  $effect(() => {
    // Rebuild charts whenever filtered data changes (after initial mount)
    const _dep = filtered.length;
    void _dep;
    if (charts.length > 0) buildCharts();
  });
</script>

<svelte:head>
  <title>Overview — Gemini Usage Tracker</title>
</svelte:head>

{#if data.errors.usage}
  <ErrorBanner message={data.errors.usage} source="usage data" />
{/if}
{#if data.errors.divisions}
  <ErrorBanner message={data.errors.divisions} source="division data" />
{/if}
{#if data.errors.students}
  <ErrorBanner message={data.errors.students} source="student data" />
{/if}

<InsightsPanel summary={data.insights.summary} />

{#if !data.usage}
  <div class="no-data">
    <h2>No usage data available</h2>
    <p>The data sync hasn't completed yet, or the Apps Script API is unreachable.</p>
  </div>
{:else}

{#if data.insights.operational.length > 0}
  <div class="operational-grid">
    {#each data.insights.operational as list (list.id)}
      <OperationalList {list} />
    {/each}
  </div>
{/if}

<!-- Stat cards -->
<div class="stats-grid">
  {#each [{ cls: 'total', label: 'Total Users', value: stats.total, sub: '' }, { cls: 'pro', label: 'Gemini Pro Users', value: stats.geminiPro.count, sub: `Avg: ${stats.geminiPro.avgUsage.toLocaleString()}` }, { cls: 'basic', label: 'Basic/No Pro Users', value: stats.basic.count, sub: `Avg: ${stats.basic.avgUsage.toLocaleString()}` }, { cls: 'high', label: 'High Priority', value: stats.priority.High.count, sub: `Pro: ${stats.priority.High.pro} | Basic: ${stats.priority.High.basic}` }, { cls: 'medium', label: 'Medium Priority', value: stats.priority.Medium.count, sub: `Pro: ${stats.priority.Medium.pro} | Basic: ${stats.priority.Medium.basic}` }, { cls: 'low', label: 'Low Priority', value: stats.priority.Low.count, sub: `Pro: ${stats.priority.Low.pro} | Basic: ${stats.priority.Low.basic}` }, { cls: 'zero', label: 'Zero Priority', value: stats.priority.Zero.count, sub: `Pro: ${stats.priority.Zero.pro} | Basic: ${stats.priority.Zero.basic}` }, { cls: 'usage', label: 'Total Usage', value: stats.totalUsage.toLocaleString(), sub: `Avg: ${stats.avgUsage.toLocaleString()}` }] as card}
    <div class="stat-card {card.cls}">
      <div class="stat-label">{card.label}</div>
      <div class="stat-value">{card.value}</div>
      {#if card.sub}<div class="stat-subtext">{card.sub}</div>{/if}
    </div>
  {/each}

  {#if data.students}
    <div class="stat-card total">
      <div class="stat-label">Students With Gemini</div>
      <div class="stat-value">{data.students.withAccess.total}</div>
    </div>
  {/if}

  {#if data.usage.studentsNoGeminiCount > 0}
    <div class="stat-card" style="border-left-color:#6d6f72;">
      <div class="stat-label">Students Without Gemini</div>
      <div class="stat-value">{data.usage.studentsNoGeminiCount}</div>
      <div class="stat-subtext">Excluded from metrics</div>
    </div>
  {/if}

  {#if data.usage.untrackedUsers.count > 0}
    <button
      class="stat-card"
      style="border-left-color:#ff9800;cursor:pointer;text-align:left;width:100%;"
      onclick={() => (showUntracked = true)}
    >
      <div class="stat-label">Untracked Users</div>
      <div class="stat-value">{data.usage.untrackedUsers.count}</div>
      <div class="stat-subtext">Not in any known list</div>
    </button>
  {/if}
</div>

<!-- Division summary -->
{#if data.divisions?.divisions}
  <div class="stats-grid">
    {#each Object.entries(data.divisions.divisions) as [name, d]}
      <a href="/divisions" style="text-decoration:none;">
        <div class="stat-card {divColors[name] ?? 'division-admin'}" style="cursor:pointer;">
          <div class="stat-label">{name}</div>
          <div class="stat-value">{d.userCount}</div>
          <div class="stat-subtext">Pro: {d.proCount} | Avg Days: {d.avgActiveDays}</div>
        </div>
      </a>
    {/each}
  </div>
{/if}

<!-- Filters -->
<div class="filters-bar">
  {#each ['all', 'pro', 'basic', 'non-active-staff', 'students'] as QuickFilter[] as f}
    <button
      class="quick-filter-btn{quickFilter === f ? ' active' : ''}"
      onclick={() => (quickFilter = f)}
    >
      {QUICK_LABELS[f]}
    </button>
  {/each}
  <div class="filter-separator"></div>
  <div class="filter-group">
    <label for="svc-filter">Service</label>
    <select id="svc-filter" bind:value={serviceFilter}>
      <option value="all">All</option>
      {#each SERVICES as s}<option value={s}>{s}</option>{/each}
    </select>
  </div>
  <div class="filter-group">
    <label for="pri-filter">Priority</label>
    <select id="pri-filter" bind:value={priorityFilter}>
      <option value="all">All</option>
      {#each ['High', 'Medium', 'Low', 'Zero'] as p}<option value={p}>{p}</option>{/each}
    </select>
  </div>
  <div class="filter-group">
    <label for="usage-filter">Min Level</label>
    <select id="usage-filter" bind:value={usageFilter}>
      <option value="all">All</option>
      <option value="low-and-above">Low+</option>
      <option value="medium-and-above">Med+</option>
      <option value="high-only">High</option>
    </select>
  </div>
  <div class="filter-group">
    <label for="search">Search</label>
    <input id="search" class="search-input" type="text" placeholder="Email…" bind:value={search} />
  </div>
</div>

<!-- Charts -->
<div class="charts-grid">
  <div class="card">
    <section>
      <div class="chart-title">Priority Distribution</div>
      <div class="chart-wrapper"><canvas bind:this={priorityDoughnutCanvas}></canvas></div>
      {#if stats.priority.High.count + stats.priority.Medium.count > 0}
        <ChartTakeaway>
          {stats.priority.High.count + stats.priority.Medium.count} of {stats.total} users
          ({Math.round(((stats.priority.High.count + stats.priority.Medium.count) / Math.max(stats.total, 1)) * 100)}%)
          are sustained adopters (High or Medium); the rest sit in the long tail.
        </ChartTakeaway>
      {/if}
    </section>
  </div>
  <div class="card">
    <section>
      <div class="chart-title">Priority: Pro vs Basic</div>
      <div class="chart-wrapper"><canvas bind:this={priorityBarCanvas}></canvas></div>
    </section>
  </div>
</div>

<div class="charts-grid">
  <div class="card">
    <section>
      <div class="chart-title">License Distribution</div>
      <div class="chart-wrapper"><canvas bind:this={licenseDoughnutCanvas}></canvas></div>
      {#if stats.geminiPro.count > 0 && stats.basic.count > 0}
        <ChartTakeaway>
          Pro holders average {stats.geminiPro.avgUsage.toLocaleString()} actions vs.
          {stats.basic.avgUsage.toLocaleString()} for Basic
          ({stats.basic.avgUsage > 0
            ? (stats.geminiPro.avgUsage / stats.basic.avgUsage).toFixed(1)
            : '∞'}× more activity per user).
        </ChartTakeaway>
      {/if}
    </section>
  </div>
  <div class="card">
    <section>
      <div class="chart-title">Gemini Usage: Pro vs Basic</div>
      <div class="chart-wrapper"><canvas bind:this={geminiBarCanvas}></canvas></div>
    </section>
  </div>
</div>

<div class="charts-grid">
  <div class="card">
    <section>
      <div class="chart-title">Service Usage</div>
      <div class="chart-wrapper"><canvas bind:this={servicesDoughnutCanvas}></canvas></div>
      {#if data.insights.summary.facts.geminiSharePct > 0}
        <ChartTakeaway>
          Gemini chat is {data.insights.summary.facts.geminiSharePct}% of recorded
          activity{#if data.insights.summary.facts.secondService}; {data.insights.summary.facts.secondService.name}
            trails at {data.insights.summary.facts.secondService.sharePct}%{/if}.
        </ChartTakeaway>
      {/if}
    </section>
  </div>
  <div class="card">
    <section>
      <div class="chart-title">Pro vs Basic by Service</div>
      <div class="chart-wrapper"><canvas bind:this={servicesBarCanvas}></canvas></div>
    </section>
  </div>
</div>

<div class="charts-grid">
  <div class="card">
    <section>
      <div class="chart-title">Top 10 Users</div>
      <div class="chart-wrapper tall"><canvas bind:this={topUsersCanvas}></canvas></div>
      {#if stats.total > 0 && stats.avgUsage > 0}
        <ChartTakeaway>
          Average activity is {stats.avgUsage.toLocaleString()} actions per user — power
          users in this chart drive a disproportionate share of total usage.
        </ChartTakeaway>
      {/if}
    </section>
  </div>
  <div class="card">
    <section>
      <div class="chart-title">Usage vs Active Days</div>
      <div class="chart-wrapper tall"><canvas bind:this={scatterCanvas}></canvas></div>
    </section>
  </div>
</div>

<!-- User table -->
<div class="card">
  <header>
    <h2>User Data ({filtered.length} users)</h2>
    <button class="btn" onclick={() => downloadCSV(sortedFiltered, 'sas-usage-analytics.csv')}>
      Export CSV
    </button>
  </header>
  <section>
    <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Email</th>
            <th>License</th>
            <th>Priority</th>
            <th>Active Days</th>
            {#each SERVICES as s}<th>{s}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each sortedFiltered as u, i}
            {@const isUntracked = data.usage.untrackedUsers.users.some(
              (x) => x.email.toLowerCase() === u.email.toLowerCase()
            )}
            <tr>
              <td>{i + 1}</td>
              <td>
                <a href="/user?email={encodeURIComponent(u.email)}" class="email-link">{u.email}</a>
              </td>
              <td>
                <span class={u.hasGeminiPro ? 'badge badge-pro' : 'badge badge-basic'}>
                  {u.hasGeminiPro ? 'Pro' : 'Basic'}
                </span>
                {#if isUntracked}
                  <span class="badge badge-untracked" style="margin-left:4px;">Untracked</span>
                {/if}
              </td>
              <td>
                <span class={priorityBadgeClass(u.overallUsagePriority)}
                  >{u.overallUsagePriority}</span
                >
                <span class="usage-value"> ({u.overallUsage.toLocaleString()})</span>
              </td>
              <td>{u.activeDays}</td>
              {#each SERVICES as s}
                <td>
                  <span class={priorityBadgeClass(u.servicesPriority[s])}
                    >{u.servicesPriority[s]}</span
                  >
                  <span class="usage-value"> ({u.services[s].toLocaleString()})</span>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>

<!-- Untracked modal -->
{#if showUntracked}
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;"
    role="presentation"
    tabindex="-1"
    onclick={() => (showUntracked = false)}
    onkeydown={(e) => e.key === 'Escape' && (showUntracked = false)}
  >
    <div
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      style="background:white;border-radius:12px;padding:30px;max-width:600px;width:90%;max-height:80vh;overflow:auto;"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <h2 style="margin-bottom:16px;color:#1a2d58;">
        Untracked Users ({data.usage.untrackedUsers.count})
      </h2>
      <table class="table">
        <thead><tr><th>#</th><th>Email</th><th>Priority</th><th>Usage</th><th>Days</th></tr></thead>
        <tbody>
          {#each [...data.usage.untrackedUsers.users].sort((a, b) => b.overallUsage - a.overallUsage) as u, i}
            <tr>
              <td>{i + 1}</td>
              <td>{u.email}</td>
              <td><span class={priorityBadgeClass(u.priority)}>{u.priority}</span></td>
              <td>{u.overallUsage.toLocaleString()}</td>
              <td>{u.activeDays}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <button class="btn" style="margin-top:16px;" onclick={() => (showUntracked = false)}
        >Close</button
      >
    </div>
  </div>
{/if}

{/if}

<style>
  .operational-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
  }
</style>
