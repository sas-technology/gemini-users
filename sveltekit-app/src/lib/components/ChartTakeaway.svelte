<script lang="ts">
  let { children }: { children: import('svelte').Snippet } = $props();
</script>

<p class="chart-takeaway">
  <span class="dot" aria-hidden="true"></span>
  {@render children()}
</p>

<style>
  .chart-takeaway {
    font-size: 13px;
    color: #555;
    line-height: 1.5;
    margin-top: 12px;
    text-align: center;
    display: inline-flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    justify-content: center;
  }
  .dot {
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sas-yellow);
    margin-top: 7px;
  }
</style>
