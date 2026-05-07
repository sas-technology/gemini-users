<script lang="ts">
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }
</script>

<nav class="nav">
  <div class="nav-brand">SAS Usage Analytics</div>
  <ul class="nav-links">
    <li><a href="/" class={page.url.pathname === '/' ? 'active' : ''}>Overview</a></li>
    <li>
      <a href="/divisions" class={page.url.pathname === '/divisions' ? 'active' : ''}>Divisions</a>
    </li>
  </ul>
  <div class="nav-right">
    <span>Singapore American School</span>
    <button class="logout-btn" onclick={logout}>Logout</button>
  </div>
</nav>

<div class="main">
  {@render children()}
</div>
