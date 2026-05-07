import { h as head, d as attr, b as ensure_array_like, e as escape_html, a as attr_class, f as derived, s as stringify } from "../../../../chunks/renderer.js";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);
    let { data } = $$props;
    function divCssClass(name) {
      return {
        "Elementary School": "division-es",
        "Middle School": "division-ms",
        "High School": "division-hs"
      }[name] ?? "division-admin";
    }
    let activeTab = "compare";
    let divNames = derived(() => Object.keys(data.divisions.divisions).sort());
    head("isgnqf", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Divisions — SAS Analytics</title>`);
      });
    });
    $$renderer2.push(`<h1 class="page-title">Division Analytics</h1> <div class="sas-tabs"><div role="tablist" aria-orientation="horizontal"><button type="button" role="tab"${attr("aria-selected", activeTab === "compare")}>Compare All</button> <!--[-->`);
    const each_array = ensure_array_like(divNames());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let name = each_array[$$index];
      $$renderer2.push(`<button type="button" role="tab"${attr("aria-selected", activeTab === name.replace(/\s+/g, "-").toLowerCase())}>${escape_html(name)}</button>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="stats-grid"><!--[-->`);
      const each_array_1 = ensure_array_like(divNames());
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let name = each_array_1[$$index_1];
        const d = data.divisions.divisions[name];
        const rate = d.userCount > 0 ? Math.round(d.proCount / d.userCount * 100) : 0;
        $$renderer2.push(`<div${attr_class(`stat-card ${stringify(divCssClass(name))}`)}><div class="stat-label">${escape_html(name)}</div> <div class="stat-value">${escape_html(d.userCount)} <span style="font-size:14px;color:#888;">users</span></div> <div class="stat-subtext">Pro: ${escape_html(d.proCount)} (${escape_html(rate)}%) | Avg Days: ${escape_html(d.avgActiveDays)}</div></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="charts-grid"><div class="card"><section><div class="chart-title">User Count by Division</div> <div class="chart-wrapper"><canvas></canvas></div></section></div> <div class="card"><section><div class="chart-title">Gemini Pro Adoption Rate</div> <div class="chart-wrapper"><canvas></canvas></div></section></div></div> <div class="charts-grid"><div class="card"><section><div class="chart-title">Priority Distribution by Division</div> <div class="chart-wrapper tall"><canvas></canvas></div></section></div> <div class="card"><section><div class="chart-title">Average Active Days by Division</div> <div class="chart-wrapper"><canvas></canvas></div></section></div></div> <div class="card"><header><h2>Division Summary</h2> <button class="btn">Export CSV</button></header> <section><div class="table-scroll"><table class="table"><thead><tr><th>Division</th><th>Users</th><th>Pro Users</th><th>Adoption Rate</th><th>Avg Active Days</th><th>High</th><th>Medium</th><th>Low</th><th>Zero</th></tr></thead><tbody><!--[-->`);
      const each_array_2 = ensure_array_like(divNames());
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let name = each_array_2[$$index_2];
        const d = data.divisions.divisions[name];
        const rate = d.userCount > 0 ? Math.round(d.proCount / d.userCount * 100) : 0;
        $$renderer2.push(`<tr><td><strong>${escape_html(name)}</strong></td><td>${escape_html(d.userCount)}</td><td>${escape_html(d.proCount)}</td><td>${escape_html(rate)}%</td><td>${escape_html(d.avgActiveDays)}</td><td><span class="badge badge-high">${escape_html(d.priorityBreakdown.High)}</span></td><td><span class="badge badge-medium">${escape_html(d.priorityBreakdown.Medium)}</span></td><td><span class="badge badge-low">${escape_html(d.priorityBreakdown.Low)}</span></td><td><span class="badge badge-zero">${escape_html(d.priorityBreakdown.Zero)}</span></td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div></section></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
