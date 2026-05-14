<script lang="ts">
  import type { ExecutiveSummary } from '$lib/insights';

  let { summary }: { summary: ExecutiveSummary } = $props();
</script>

<aside class="insights-panel" aria-labelledby="insights-heading">
  <header>
    <span class="insights-eyebrow">What's happening</span>
    <h2 id="insights-heading">This period at a glance</h2>
  </header>
  <ul>
    {#each summary.sentences as sentence (sentence)}
      <li>{sentence}</li>
    {/each}
  </ul>
</aside>

<style>
  .insights-panel {
    background: linear-gradient(135deg, var(--sas-blue) 0%, #243a6d 100%);
    color: white;
    border-radius: var(--radius);
    padding: 24px 28px;
    margin-bottom: 25px;
    box-shadow: 0 2px 12px rgba(26, 45, 88, 0.18);
  }
  .insights-panel header {
    margin-bottom: 14px;
  }
  .insights-eyebrow {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--sas-yellow);
    margin-bottom: 6px;
  }
  .insights-panel h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }
  .insights-panel ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .insights-panel li {
    font-size: 15px;
    line-height: 1.55;
    padding-left: 22px;
    position: relative;
  }
  .insights-panel li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 9px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--sas-yellow);
  }
</style>
