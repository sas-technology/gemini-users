<script lang="ts">
  import type { DivisionInsight } from '$lib/insights';

  let { insight }: { insight: DivisionInsight } = $props();

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
</script>

<article class="div-insight {divCssClass(insight.name)}">
  <header>
    <h3>{insight.name}</h3>
    <span class="adoption">{insight.facts.activeAdoptionPct}% active</span>
  </header>
  <ul>
    {#each insight.sentences as sentence (sentence)}
      <li>{sentence}</li>
    {/each}
  </ul>
</article>

<style>
  .div-insight {
    background: white;
    border-radius: var(--radius);
    padding: 18px 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #6d6f72;
  }
  .div-insight.division-es {
    border-left-color: var(--elementary);
  }
  .div-insight.division-ms {
    border-left-color: var(--middle-school);
  }
  .div-insight.division-hs {
    border-left-color: var(--high-school);
  }
  .div-insight.division-admin {
    border-left-color: var(--admin);
  }
  .div-insight header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
  }
  .div-insight h3 {
    font-size: 16px;
    font-weight: 700;
    color: var(--sas-blue);
  }
  .adoption {
    font-size: 12px;
    font-weight: 700;
    color: #555;
    background: #f0f4ff;
    padding: 2px 8px;
    border-radius: 999px;
  }
  .div-insight ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .div-insight li {
    font-size: 13px;
    line-height: 1.5;
    color: #444;
    padding-left: 14px;
    position: relative;
  }
  .div-insight li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--sas-yellow);
  }
</style>
