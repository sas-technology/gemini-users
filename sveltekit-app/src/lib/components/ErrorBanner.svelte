<script lang="ts">
  let { message, source }: { message: string; source?: string } = $props();
</script>

<div class="error-banner" role="status">
  <strong>Couldn't load {source ?? 'data'} right now.</strong>
  <span>{message}</span>
</div>

<style>
  .error-banner {
    background: #fff8e1;
    border: 1px solid #ffe082;
    border-left: 4px solid var(--sas-yellow);
    color: #5d4037;
    padding: 12px 16px;
    border-radius: var(--radius);
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
  .error-banner strong {
    color: #3e2723;
  }
</style>
