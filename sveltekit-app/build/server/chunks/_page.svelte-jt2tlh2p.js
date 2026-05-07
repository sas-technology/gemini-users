import { j as head, k as ensure_array_like, d as attr_class, l as stringify, c as escape_html, m as attr, f as clsx, o as derived } from './renderer-CUWHMQgx.js';
import { S as SERVICES } from './types-CuSQq3lV.js';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);
    let { data } = $$props;
    let quickFilter = "all";
    let serviceFilter = "all";
    let priorityFilter = "all";
    let usageFilter = "all";
    let search = "";
    const divColors = {
      "Elementary School": "division-es",
      "Middle School": "division-ms",
      "High School": "division-hs"
    };
    const QUICK_LABELS = {
      all: "All Users",
      pro: "AI Pro Users",
      basic: "Basic Only",
      "non-active-staff": "Non-Active Staff",
      students: "Students"
    };
    let filtered = derived(() => {
      return data.usage.users.filter((u) => {
        return true;
      });
    });
    let stats = derived(() => {
      const s = {
        total: filtered().length,
        totalUsage: 0,
        avgUsage: 0,
        priority: {
          High: { count: 0, pro: 0, basic: 0 },
          Medium: { count: 0, pro: 0, basic: 0 },
          Low: { count: 0, pro: 0, basic: 0 },
          Zero: { count: 0, pro: 0, basic: 0 }
        },
        geminiPro: { count: 0, totalUsage: 0, avgUsage: 0, geminiUsage: 0 },
        basic: { count: 0, totalUsage: 0, avgUsage: 0, geminiUsage: 0 },
        services: Object.fromEntries(SERVICES.map((sv) => [sv, { total: 0, pro: 0, basic: 0 }])),
        topUsers: []
      };
      for (const u of filtered()) {
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
      s.geminiPro.avgUsage = s.geminiPro.count > 0 ? Math.round(s.geminiPro.totalUsage / s.geminiPro.count) : 0;
      s.basic.avgUsage = s.basic.count > 0 ? Math.round(s.basic.totalUsage / s.basic.count) : 0;
      s.topUsers = [...filtered()].sort((a, b) => b.overallUsage - a.overallUsage).slice(0, 10);
      return s;
    });
    let sortedFiltered = derived(() => [...filtered()].sort((a, b) => b.overallUsage - a.overallUsage));
    function priorityBadgeClass(p) {
      return `badge badge-${(p || "zero").toLowerCase()}`;
    }
    head("ubrou8", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Overview — SAS Analytics</title>`);
      });
    });
    $$renderer2.push(`<div class="stats-grid"><!--[-->`);
    const each_array = ensure_array_like([
      {
        cls: "total",
        label: "Total Users",
        value: stats().total,
        sub: ""
      },
      {
        cls: "pro",
        label: "Gemini Pro Users",
        value: stats().geminiPro.count,
        sub: `Avg: ${stats().geminiPro.avgUsage.toLocaleString()}`
      },
      {
        cls: "basic",
        label: "Basic/No Pro Users",
        value: stats().basic.count,
        sub: `Avg: ${stats().basic.avgUsage.toLocaleString()}`
      },
      {
        cls: "high",
        label: "High Priority",
        value: stats().priority.High.count,
        sub: `Pro: ${stats().priority.High.pro} | Basic: ${stats().priority.High.basic}`
      },
      {
        cls: "medium",
        label: "Medium Priority",
        value: stats().priority.Medium.count,
        sub: `Pro: ${stats().priority.Medium.pro} | Basic: ${stats().priority.Medium.basic}`
      },
      {
        cls: "low",
        label: "Low Priority",
        value: stats().priority.Low.count,
        sub: `Pro: ${stats().priority.Low.pro} | Basic: ${stats().priority.Low.basic}`
      },
      {
        cls: "zero",
        label: "Zero Priority",
        value: stats().priority.Zero.count,
        sub: `Pro: ${stats().priority.Zero.pro} | Basic: ${stats().priority.Zero.basic}`
      },
      {
        cls: "usage",
        label: "Total Usage",
        value: stats().totalUsage.toLocaleString(),
        sub: `Avg: ${stats().avgUsage.toLocaleString()}`
      }
    ]);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let card = each_array[$$index];
      $$renderer2.push(`<div${attr_class(`stat-card ${stringify(card.cls)}`)}><div class="stat-label">${escape_html(card.label)}</div> <div class="stat-value">${escape_html(card.value)}</div> `);
      if (card.sub) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="stat-subtext">${escape_html(card.sub)}</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.students) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="stat-card total"><div class="stat-label">Students With Gemini</div> <div class="stat-value">${escape_html(data.students.withAccess.total)}</div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.usage.studentsNoGeminiCount > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="stat-card" style="border-left-color:#6d6f72;"><div class="stat-label">Students Without Gemini</div> <div class="stat-value">${escape_html(data.usage.studentsNoGeminiCount)}</div> <div class="stat-subtext">Excluded from metrics</div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.usage.untrackedUsers.count > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="stat-card" style="border-left-color:#ff9800;cursor:pointer;text-align:left;width:100%;"><div class="stat-label">Untracked Users</div> <div class="stat-value">${escape_html(data.usage.untrackedUsers.count)}</div> <div class="stat-subtext">Not in any known list</div></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.divisions?.divisions) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="stats-grid"><!--[-->`);
      const each_array_1 = ensure_array_like(Object.entries(data.divisions.divisions));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let [name, d] = each_array_1[$$index_1];
        $$renderer2.push(`<a href="/divisions" style="text-decoration:none;"><div${attr_class(`stat-card ${stringify(divColors[name] ?? "division-admin")}`)} style="cursor:pointer;"><div class="stat-label">${escape_html(name)}</div> <div class="stat-value">${escape_html(d.userCount)}</div> <div class="stat-subtext">Pro: ${escape_html(d.proCount)} | Avg Days: ${escape_html(d.avgActiveDays)}</div></div></a>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="filters-bar"><!--[-->`);
    const each_array_2 = ensure_array_like(["all", "pro", "basic", "non-active-staff", "students"]);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let f = each_array_2[$$index_2];
      $$renderer2.push(`<button${attr_class(`quick-filter-btn${stringify(quickFilter === f ? " active" : "")}`)}>${escape_html(QUICK_LABELS[f])}</button>`);
    }
    $$renderer2.push(`<!--]--> <div class="filter-separator"></div> <div class="filter-group"><label for="svc-filter">Service</label> `);
    $$renderer2.select({ id: "svc-filter", value: serviceFilter }, ($$renderer3) => {
      $$renderer3.option({ value: "all" }, ($$renderer4) => {
        $$renderer4.push(`All`);
      });
      $$renderer3.push(`<!--[-->`);
      const each_array_3 = ensure_array_like(SERVICES);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let s = each_array_3[$$index_3];
        $$renderer3.option({ value: s }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(s)}`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</div> <div class="filter-group"><label for="pri-filter">Priority</label> `);
    $$renderer2.select({ id: "pri-filter", value: priorityFilter }, ($$renderer3) => {
      $$renderer3.option({ value: "all" }, ($$renderer4) => {
        $$renderer4.push(`All`);
      });
      $$renderer3.push(`<!--[-->`);
      const each_array_4 = ensure_array_like(["High", "Medium", "Low", "Zero"]);
      for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
        let p = each_array_4[$$index_4];
        $$renderer3.option({ value: p }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(p)}`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</div> <div class="filter-group"><label for="usage-filter">Min Level</label> `);
    $$renderer2.select({ id: "usage-filter", value: usageFilter }, ($$renderer3) => {
      $$renderer3.option({ value: "all" }, ($$renderer4) => {
        $$renderer4.push(`All`);
      });
      $$renderer3.option({ value: "low-and-above" }, ($$renderer4) => {
        $$renderer4.push(`Low+`);
      });
      $$renderer3.option({ value: "medium-and-above" }, ($$renderer4) => {
        $$renderer4.push(`Med+`);
      });
      $$renderer3.option({ value: "high-only" }, ($$renderer4) => {
        $$renderer4.push(`High`);
      });
    });
    $$renderer2.push(`</div> <div class="filter-group"><label for="search">Search</label> <input id="search" class="search-input" type="text" placeholder="Email…"${attr("value", search)}/></div></div> <div class="charts-grid"><div class="card"><section><div class="chart-title">Priority Distribution</div> <div class="chart-wrapper"><canvas></canvas></div></section></div> <div class="card"><section><div class="chart-title">Priority: Pro vs Basic</div> <div class="chart-wrapper"><canvas></canvas></div></section></div></div> <div class="charts-grid"><div class="card"><section><div class="chart-title">License Distribution</div> <div class="chart-wrapper"><canvas></canvas></div></section></div> <div class="card"><section><div class="chart-title">Gemini Usage: Pro vs Basic</div> <div class="chart-wrapper"><canvas></canvas></div></section></div></div> <div class="charts-grid"><div class="card"><section><div class="chart-title">Service Usage</div> <div class="chart-wrapper"><canvas></canvas></div></section></div> <div class="card"><section><div class="chart-title">Pro vs Basic by Service</div> <div class="chart-wrapper"><canvas></canvas></div></section></div></div> <div class="charts-grid"><div class="card"><section><div class="chart-title">Top 10 Users</div> <div class="chart-wrapper tall"><canvas></canvas></div></section></div> <div class="card"><section><div class="chart-title">Usage vs Active Days</div> <div class="chart-wrapper tall"><canvas></canvas></div></section></div></div> <div class="card"><header><h2>User Data (${escape_html(filtered().length)} users)</h2> <button class="btn">Export CSV</button></header> <section><div class="table-scroll"><table class="table"><thead><tr><th>#</th><th>Email</th><th>License</th><th>Priority</th><th>Active Days</th><!--[-->`);
    const each_array_5 = ensure_array_like(SERVICES);
    for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
      let s = each_array_5[$$index_5];
      $$renderer2.push(`<th>${escape_html(s)}</th>`);
    }
    $$renderer2.push(`<!--]--></tr></thead><tbody><!--[-->`);
    const each_array_6 = ensure_array_like(sortedFiltered());
    for (let i = 0, $$length = each_array_6.length; i < $$length; i++) {
      let u = each_array_6[i];
      const isUntracked = data.usage.untrackedUsers.users.some((x) => x.email.toLowerCase() === u.email.toLowerCase());
      $$renderer2.push(`<tr><td>${escape_html(i + 1)}</td><td><a${attr("href", `/user?email=${stringify(encodeURIComponent(u.email))}`)} class="email-link">${escape_html(u.email)}</a></td><td><span${attr_class(clsx(u.hasGeminiPro ? "badge badge-pro" : "badge badge-basic"))}>${escape_html(u.hasGeminiPro ? "Pro" : "Basic")}</span> `);
      if (isUntracked) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="badge badge-untracked" style="margin-left:4px;">Untracked</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></td><td><span${attr_class(clsx(priorityBadgeClass(u.overallUsagePriority)))}>${escape_html(u.overallUsagePriority)}</span> <span class="usage-value">(${escape_html(u.overallUsage.toLocaleString())})</span></td><td>${escape_html(u.activeDays)}</td><!--[-->`);
      const each_array_7 = ensure_array_like(SERVICES);
      for (let $$index_6 = 0, $$length2 = each_array_7.length; $$index_6 < $$length2; $$index_6++) {
        let s = each_array_7[$$index_6];
        $$renderer2.push(`<td><span${attr_class(clsx(priorityBadgeClass(u.servicesPriority[s])))}>${escape_html(u.servicesPriority[s])}</span> <span class="usage-value">(${escape_html(u.services[s].toLocaleString())})</span></td>`);
      }
      $$renderer2.push(`<!--]--></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div></section></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-jt2tlh2p.js.map
