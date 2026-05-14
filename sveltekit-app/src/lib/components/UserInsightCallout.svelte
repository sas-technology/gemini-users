<script lang="ts">
  import type { UserInsight } from '$lib/insights';

  let { insight }: { insight: UserInsight } = $props();

  const RECOMMENDATION_LABEL: Record<UserInsight['facts']['licenseRecommendation'], string> = {
    review: 'License review candidate',
    upgrade: 'Pro upgrade candidate',
    keep: 'Active Pro user',
    none: '',
  };
  const RECOMMENDATION_TONE: Record<UserInsight['facts']['licenseRecommendation'], string> = {
    review: 'tone-warning',
    upgrade: 'tone-info',
    keep: 'tone-success',
    none: '',
  };
</script>

<aside class="user-insight" aria-labelledby="user-insight-heading">
  <header>
    <h3 id="user-insight-heading">What this profile shows</h3>
    {#if insight.facts.licenseRecommendation !== 'none'}
      <span class="rec {RECOMMENDATION_TONE[insight.facts.licenseRecommendation]}">
        {RECOMMENDATION_LABEL[insight.facts.licenseRecommendation]}
      </span>
    {/if}
  </header>
  <ul>
    {#each insight.sentences as sentence (sentence)}
      <li>{sentence}</li>
    {/each}
  </ul>
</aside>

<style>
  .user-insight {
    background: white;
    border-radius: var(--radius);
    padding: 18px 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-left: 4px solid var(--sas-yellow);
    margin-bottom: 25px;
  }
  .user-insight header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .user-insight h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--sas-blue);
    margin: 0;
  }
  .rec {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 10px;
    border-radius: 999px;
  }
  .tone-warning {
    background: #fff3e0;
    color: #c66900;
  }
  .tone-info {
    background: #e8f4fb;
    color: var(--elementary);
  }
  .tone-success {
    background: #e6f6ec;
    color: #1f7a3a;
  }
  .user-insight ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .user-insight li {
    font-size: 14px;
    line-height: 1.5;
    color: #333;
    padding-left: 16px;
    position: relative;
  }
  .user-insight li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 9px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sas-yellow);
  }
</style>
