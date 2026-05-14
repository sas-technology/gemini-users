<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open,
    title,
    onClose,
    children,
  }: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: Snippet;
  } = $props();

  function onBackdropKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="presentation"
    tabindex="-1"
    onclick={onClose}
    onkeydown={onBackdropKey}
  >
    <div
      class="modal-window"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <h2 id="modal-title">{title}</h2>
      <div class="modal-body">
        {@render children()}
      </div>
      <button class="btn modal-close" onclick={onClose}>Close</button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-window {
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  }
  .modal-window h2 {
    color: var(--sas-blue);
    margin-bottom: 16px;
  }
  .modal-body {
    margin-bottom: 16px;
  }
  .modal-close {
    margin-top: 4px;
  }
</style>
