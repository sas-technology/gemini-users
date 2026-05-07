import { h as head, e as escape_html, a as attr_class, c as clsx, s as stringify, b as ensure_array_like } from "../../../../chunks/renderer.js";
import { S as SERVICES } from "../../../../chunks/types.js";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
    let { data } = $$props;
    function getInitials(name) {
      const words = name.trim().split(/\s+/);
      if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    function priorityBadgeClass(p) {
      return `badge badge-${(p || "zero").toLowerCase()}`;
    }
    head("14c2q1s", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.profile ? data.profile.name || data.profile.email : "User Profile")} — SAS Analytics</title>`);
      });
    });
    $$renderer2.push(`<a href="/" class="back-btn">← Back to Overview</a> `);
    if (!data.email) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="no-data"><h2>No email specified</h2><p>Navigate from the Overview page.</p></div>`);
    } else if (!data.profile) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="no-data"><h2>User not found</h2><p>${escape_html(data.email)}</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      const p = data.profile;
      $$renderer2.push(`<div class="profile-header"><div class="profile-avatar">${escape_html(getInitials(p.name || p.email))}</div> <div class="profile-info"><h2>${escape_html(p.name || p.email)}</h2> <p>${escape_html(p.email)}</p> `);
      if (p.division) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p>${escape_html(p.division)}${escape_html(p.jobTitle ? ` — ${p.jobTitle}` : "")}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div style="margin-left:auto;text-align:right;"><span${attr_class(clsx(p.hasGeminiPro ? "badge badge-pro" : "badge badge-basic"))} style="font-size:14px;padding:6px 16px;">${escape_html(p.hasGeminiPro ? "Gemini Pro" : "Basic")}</span> `);
      if (p.personId) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div style="margin-top:8px;font-size:12px;color:#999;">ID: ${escape_html(p.personId)}</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="stats-grid"><div${attr_class(`stat-card ${stringify((p.overallPriority || "zero").toLowerCase())}`)}><div class="stat-label">Overall Priority</div> <div class="stat-value"><span${attr_class(clsx(priorityBadgeClass(p.overallPriority)))} style="font-size:18px;padding:6px 16px;">${escape_html(p.overallPriority)}</span></div></div> <div class="stat-card usage"><div class="stat-label">Overall Usage</div> <div class="stat-value">${escape_html(p.overallUsage.toLocaleString())}</div></div> <div class="stat-card total"><div class="stat-label">Active Days</div> <div class="stat-value">${escape_html(p.activeDays)}</div> `);
      if (p.divisionAvg.activeDays !== void 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="stat-subtext">Division avg: ${escape_html(p.divisionAvg.activeDays)}</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (p.divisionAvg.userCount > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="stat-card basic"><div class="stat-label">Division Size</div> <div class="stat-value">${escape_html(p.divisionAvg.userCount)}</div> <div class="stat-subtext">${escape_html(p.division)}</div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="charts-grid"><div class="card"><section><div class="chart-title">Service Usage Breakdown</div> <div class="chart-wrapper tall"><canvas></canvas></div></section></div> <div class="card"><section><div class="chart-title">Service Priority Labels</div> <div class="chart-wrapper tall" style="display:flex;align-items:center;justify-content:center;"><table style="width:100%;font-size:14px;"><tbody><!--[-->`);
      const each_array = ensure_array_like(SERVICES);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let svc = each_array[$$index];
        $$renderer2.push(`<tr><td style="padding:10px 15px;font-weight:600;">${escape_html(svc)}</td><td style="padding:10px 15px;"><span${attr_class(clsx(priorityBadgeClass(p.servicesPriority[svc] ?? "Zero")))}>${escape_html(p.servicesPriority[svc] ?? "Zero")}</span></td><td style="padding:10px 15px;text-align:right;color:#1a2d58;font-weight:600;">${escape_html((p.services[svc] ?? 0).toLocaleString())}</td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div></section></div></div> `);
      if (p.divisionAvg.activeDays !== void 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="charts-grid"><div class="card"><section><div class="chart-title">You vs ${escape_html(p.division || "Division")} Average</div> <div class="chart-wrapper"><canvas></canvas></div></section></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="card"><header><h2>Service Details</h2> <button class="btn">Export CSV</button></header> <section><div class="table-scroll"><table class="table"><thead><tr><th>Service</th><th>Usage Count</th><th>Priority</th></tr></thead><tbody><!--[-->`);
      const each_array_1 = ensure_array_like(SERVICES);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let svc = each_array_1[$$index_1];
        $$renderer2.push(`<tr><td><strong>${escape_html(svc)}</strong></td><td class="usage-value">${escape_html((p.services[svc] ?? 0).toLocaleString())}</td><td><span${attr_class(clsx(priorityBadgeClass(p.servicesPriority[svc] ?? "Zero")))}>${escape_html(p.servicesPriority[svc] ?? "Zero")}</span></td></tr>`);
      }
      $$renderer2.push(`<!--]--><tr style="border-top:2px solid #1a2d58;font-weight:700;"><td>Total</td><td class="usage-value">${escape_html(p.overallUsage.toLocaleString())}</td><td><span${attr_class(clsx(priorityBadgeClass(p.overallPriority)))}>${escape_html(p.overallPriority)}</span></td></tr></tbody></table></div></section></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
