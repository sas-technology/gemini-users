<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Sign In — Gemini Usage Tracker</title>
</svelte:head>

<div
  style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f2f5;"
>
  <div
    style="background:white;border-radius:12px;padding:40px;width:360px;box-shadow:0 4px 24px rgba(0,0,0,0.12);border:1px solid #e5e7eb;"
  >
    <div style="text-align:center;margin-bottom:32px;">
      <div
        style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#1a2d58 0%,#a0192a 100%);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;"
      >
        <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#1a2d58;margin-bottom:4px;">
        SAS Technology &amp; Innovation
      </h1>
      <p style="font-size:13px;color:#888;">Gemini Usage Tracker</p>
    </div>

    <form
      method="POST"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          await update();
        };
      }}
    >
      <div style="margin-bottom:20px;">
        <label
          for="password"
          style="display:block;font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;"
        >
          Dashboard Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter password"
          required
          style="width:100%;padding:10px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:inherit;outline:none;"
        />
      </div>

      {#if form?.error}
        <div
          style="background:#fff0f0;border:1px solid #ffcccc;border-radius:6px;padding:8px 12px;margin-bottom:16px;font-size:13px;color:#a0192a;"
        >
          {form.error}
        </div>
      {/if}

      <button
        type="submit"
        disabled={loading}
        style="width:100%;padding:11px;background:{loading
          ? '#9aa5bc'
          : '#1a2d58'};color:white;border:none;border-radius:8px;font-size:15px;font-weight:700;font-family:inherit;cursor:{loading
          ? 'not-allowed'
          : 'pointer'};"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  </div>
</div>
