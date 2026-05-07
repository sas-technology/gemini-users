<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { Division, DivisionUser, UsagePriority } from '$lib/types';
  import {
    Chart,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
  } from 'chart.js';

  Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

  let { data }: { data: PageData } = $props();

  const CHART_COLORS = { purple: '#c42384', gray: '#97999c' };
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

  let activeTab = $state('compare');
  let divNames = $derived(Object.keys(data.divisions.divisions).sort());
  let activeDiv = $derived(
    divNames.find((n) => n.replace(/\s+/g, '-').toLowerCase() === activeTab)
  );

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

  // Compare view chart refs
  let userCountCanvas = $state<HTMLCanvasElement>(null!);
  let proAdoptionCanvas = $state<HTMLCanvasElement>(null!);
  let priorityDistCanvas = $state<HTMLCanvasElement>(null!);
  let avgDaysCanvas = $state<HTMLCanvasElement>(null!);

  // Division view chart refs
  let divPriorityCanvas = $state<HTMLCanvasElement>(null!);
  let divLicenseCanvas = $state<HTMLCanvasElement>(null!);
  let divTopUsersCanvas = $state<HTMLCanvasElement>(null!);

  let charts: Chart[] = [];

  function destroyCharts() {
    charts.forEach((c) => c.destroy());
    charts = [];
  }

  function buildCompareCharts() {
    destroyCharts();
    if (!userCountCanvas) return;
    const names = divNames;
    const colors = names.map((n) => DIVISION_COLORS[n] ?? '#6d6f72');
    const divs = data.divisions.divisions;

    charts.push(
      new Chart(userCountCanvas, {
        type: 'bar',
        data: {
          labels: names,
          datasets: [
            {
              label: 'Total Users',
              data: names.map((n) => divs[n].userCount),
              backgroundColor: colors,
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
      new Chart(proAdoptionCanvas, {
        type: 'bar',
        data: {
          labels: names,
          datasets: [
            {
              label: 'Pro Users',
              data: names.map((n) => divs[n].proCount),
              backgroundColor: CHART_COLORS.purple,
              stack: 's',
            },
            {
              label: 'Basic Users',
              data: names.map((n) => divs[n].userCount - divs[n].proCount),
              backgroundColor: CHART_COLORS.gray,
              stack: 's',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true, stacked: true }, x: { stacked: true } },
        },
      })
    );
    charts.push(
      new Chart(priorityDistCanvas, {
        type: 'bar',
        data: {
          labels: names,
          datasets: (['High', 'Medium', 'Low', 'Zero'] as UsagePriority[]).map((p) => ({
            label: p,
            data: names.map((n) => divs[n].priorityBreakdown[p]),
            backgroundColor: PRIORITY_COLORS[p],
          })),
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
      new Chart(avgDaysCanvas, {
        type: 'bar',
        data: {
          labels: names,
          datasets: [
            {
              label: 'Avg Active Days',
              data: names.map((n) => divs[n].avgActiveDays),
              backgroundColor: colors,
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
  }

  function buildDivisionCharts(div: Division) {
    destroyCharts();
    if (!divPriorityCanvas) return;
    charts.push(
      new Chart(divPriorityCanvas, {
        type: 'doughnut',
        data: {
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
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      })
    );
    charts.push(
      new Chart(divLicenseCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Gemini Pro', 'Basic'],
          datasets: [
            {
              data: [div.proCount, div.userCount - div.proCount],
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
    if (divTopUsersCanvas && div.topUsers.length > 0) {
      charts.push(
        new Chart(divTopUsersCanvas, {
          type: 'bar',
          data: {
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
    }
  }

  onMount(() => {
    buildCompareCharts();
    return destroyCharts;
  });

  $effect(() => {
    const tab = activeTab;
    void tab;
    if (tab === 'compare') {
      setTimeout(buildCompareCharts, 0);
    } else {
      const div = activeDiv ? data.divisions.divisions[activeDiv] : null;
      if (div) setTimeout(() => buildDivisionCharts(div), 0);
    }
  });
</script>

<svelte:head><title>Divisions — SAS Analytics</title></svelte:head>

<h1 class="page-title">Division Analytics</h1>

<div class="sas-tabs">
  <div role="tablist" aria-orientation="horizontal">
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'compare'}
      onclick={() => (activeTab = 'compare')}
    >
      Compare All
    </button>
    {#each divNames as name}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === name.replace(/\s+/g, '-').toLowerCase()}
        onclick={() => (activeTab = name.replace(/\s+/g, '-').toLowerCase())}
      >
        {name}
      </button>
    {/each}
  </div>
</div>

{#if activeTab === 'compare'}
  <!-- Compare view -->
  <div class="stats-grid">
    {#each divNames as name}
      {@const d = data.divisions.divisions[name]}
      {@const rate = d.userCount > 0 ? Math.round((d.proCount / d.userCount) * 100) : 0}
      <div class="stat-card {divCssClass(name)}">
        <div class="stat-label">{name}</div>
        <div class="stat-value">
          {d.userCount} <span style="font-size:14px;color:#888;">users</span>
        </div>
        <div class="stat-subtext">Pro: {d.proCount} ({rate}%) | Avg Days: {d.avgActiveDays}</div>
      </div>
    {/each}
  </div>

  <div class="charts-grid">
    <div class="card">
      <section>
        <div class="chart-title">User Count by Division</div>
        <div class="chart-wrapper"><canvas bind:this={userCountCanvas}></canvas></div>
      </section>
    </div>
    <div class="card">
      <section>
        <div class="chart-title">Gemini Pro Adoption Rate</div>
        <div class="chart-wrapper"><canvas bind:this={proAdoptionCanvas}></canvas></div>
      </section>
    </div>
  </div>

  <div class="charts-grid">
    <div class="card">
      <section>
        <div class="chart-title">Priority Distribution by Division</div>
        <div class="chart-wrapper tall"><canvas bind:this={priorityDistCanvas}></canvas></div>
      </section>
    </div>
    <div class="card">
      <section>
        <div class="chart-title">Average Active Days by Division</div>
        <div class="chart-wrapper"><canvas bind:this={avgDaysCanvas}></canvas></div>
      </section>
    </div>
  </div>

  <div class="card">
    <header>
      <h2>Division Summary</h2>
      <button
        class="btn"
        onclick={() => {
          const rows = divNames.map((n) => {
            const d = data.divisions.divisions[n];
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
        }}>Export CSV</button
      >
    </header>
    <section>
      <div class="table-scroll">
        <table class="table">
          <thead
            ><tr
              ><th>Division</th><th>Users</th><th>Pro Users</th><th>Adoption Rate</th><th
                >Avg Active Days</th
              ><th>High</th><th>Medium</th><th>Low</th><th>Zero</th></tr
            ></thead
          >
          <tbody>
            {#each divNames as name}
              {@const d = data.divisions.divisions[name]}
              {@const rate = d.userCount > 0 ? Math.round((d.proCount / d.userCount) * 100) : 0}
              <tr>
                <td><strong>{name}</strong></td>
                <td>{d.userCount}</td>
                <td>{d.proCount}</td>
                <td>{rate}%</td>
                <td>{d.avgActiveDays}</td>
                <td><span class="badge badge-high">{d.priorityBreakdown.High}</span></td>
                <td><span class="badge badge-medium">{d.priorityBreakdown.Medium}</span></td>
                <td><span class="badge badge-low">{d.priorityBreakdown.Low}</span></td>
                <td><span class="badge badge-zero">{d.priorityBreakdown.Zero}</span></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </div>
{:else if activeDiv}
  <!-- Individual division view -->
  {@const div = data.divisions.divisions[activeDiv]}
  {@const adoptionRate = div.userCount > 0 ? Math.round((div.proCount / div.userCount) * 100) : 0}
  {@const sorted = [...div.users].sort((a, b) => b.activeDays - a.activeDays)}

  <div class="stats-grid">
    <div class="stat-card {divCssClass(activeDiv)}">
      <div class="stat-label">Total Users</div>
      <div class="stat-value">{div.userCount}</div>
    </div>
    <div class="stat-card pro">
      <div class="stat-label">Gemini Pro</div>
      <div class="stat-value">{div.proCount}</div>
      <div class="stat-subtext">{adoptionRate}% adoption</div>
    </div>
    <div class="stat-card basic">
      <div class="stat-label">Basic</div>
      <div class="stat-value">{div.userCount - div.proCount}</div>
    </div>
    <div class="stat-card usage">
      <div class="stat-label">Avg Active Days</div>
      <div class="stat-value">{div.avgActiveDays}</div>
    </div>
  </div>

  <div class="stats-grid">
    {#each ['High', 'Medium', 'Low', 'Zero'] as UsagePriority[] as p}
      {@const count = div.priorityBreakdown[p]}
      {@const pct = div.userCount > 0 ? Math.round((count / div.userCount) * 100) : 0}
      <div class="stat-card {p.toLowerCase()}">
        <div class="stat-label">{p} Priority</div>
        <div class="stat-value">{count}</div>
        <div class="stat-subtext">{pct}% of division</div>
      </div>
    {/each}
  </div>

  <div class="charts-grid">
    <div class="card">
      <section>
        <div class="chart-title">Priority Distribution</div>
        <div class="chart-wrapper"><canvas bind:this={divPriorityCanvas}></canvas></div>
      </section>
    </div>
    <div class="card">
      <section>
        <div class="chart-title">License Breakdown</div>
        <div class="chart-wrapper"><canvas bind:this={divLicenseCanvas}></canvas></div>
      </section>
    </div>
  </div>

  {#if div.topUsers.length > 0}
    <div class="charts-grid">
      <div class="card">
        <section>
          <div class="chart-title">Top Users by Active Days</div>
          <div class="chart-wrapper tall"><canvas bind:this={divTopUsersCanvas}></canvas></div>
        </section>
      </div>
    </div>
  {/if}

  <div class="card">
    <header>
      <h2>{activeDiv} Users ({div.users.length})</h2>
      <button
        class="btn"
        onclick={() =>
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
            `sas-${activeDiv.toLowerCase().replace(/\s+/g, '-')}-users.csv`
          )}
      >
        Export CSV
      </button>
    </header>
    <section>
      <div class="table-scroll">
        <table class="table">
          <thead
            ><tr
              ><th>#</th><th>Name</th><th>Email</th><th>Job Title</th><th>License</th><th
                >Priority</th
              ><th>Active Days</th></tr
            ></thead
          >
          <tbody>
            {#each sorted as u, i}
              <tr>
                <td>{i + 1}</td>
                <td>{u.name}</td>
                <td
                  ><a href="/user?email={encodeURIComponent(u.email)}" class="email-link"
                    >{u.email}</a
                  ></td
                >
                <td>{u.jobTitle}</td>
                <td
                  ><span class={u.hasGeminiPro ? 'badge badge-pro' : 'badge badge-basic'}
                    >{u.hasGeminiPro ? 'Pro' : 'Basic'}</span
                  ></td
                >
                <td><span class="badge badge-{u.priority.toLowerCase()}">{u.priority}</span></td>
                <td>{u.activeDays}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </div>
{:else}
  <div class="no-data"><h2>Division not found</h2></div>
{/if}
