<script lang="ts">
  import type { OperationalList as OperationalListData } from '$lib/insights';

  let { list }: { list: OperationalListData } = $props();
</script>

<article class="card">
  <header>
    <h2>{list.title}</h2>
    <span class="op-count">{list.users.length}</span>
  </header>
  <section>
    <p class="op-description">{list.description}</p>
    {#if list.users.length === 0}
      <p class="op-empty">Nothing to flag here right now.</p>
    {:else}
      <ul class="op-list">
        {#each list.users as user (user.email)}
          <li>
            <a href="/user?email={encodeURIComponent(user.email)}" class="email-link">
              {user.email}
            </a>
            <span class="op-meta">{user.meta}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</article>

<style>
  .op-count {
    background: var(--sas-blue);
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 999px;
  }
  .op-description {
    font-size: 13px;
    color: #666;
    margin-bottom: 14px;
  }
  .op-empty {
    font-size: 13px;
    color: #28a745;
    font-style: italic;
  }
  .op-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .op-list li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 6px;
    background: #f8faff;
    border-left: 3px solid var(--sas-blue);
  }
  .op-meta {
    font-size: 12px;
    color: #666;
  }
</style>
