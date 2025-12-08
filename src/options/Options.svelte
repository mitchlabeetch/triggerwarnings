<script lang="ts">
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import type { Profile, Theme } from '@shared/types/Profile.types';
  import {
    TRIGGER_CATEGORIES,
    HIGH_SEVERITY_CATEGORIES,
    MEDIUM_SEVERITY_CATEGORIES,
    LOW_SEVERITY_CATEGORIES,
  } from '@shared/constants/categories';
  import ToastContainer from '@shared/components/ToastContainer.svelte';
  import Stats from './components/Stats.svelte';
  import { toast } from '@shared/utils/toast';

  let activeProfile: Profile | null = null;
  let allProfiles: Profile[] = [];
  let loading = false;
  let saving = false;
  let activeTab: 'categories' | 'settings' | 'stats' = 'categories';
  let searchQuery = '';

  // Filtered categories based on search
  $: filteredHigh = searchQuery
    ? HIGH_SEVERITY_CATEGORIES.filter((key) =>
        TRIGGER_CATEGORIES[key].name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : HIGH_SEVERITY_CATEGORIES;
  $: filteredMedium = searchQuery
    ? MEDIUM_SEVERITY_CATEGORIES.filter((key) =>
        TRIGGER_CATEGORIES[key].name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MEDIUM_SEVERITY_CATEGORIES;
  $: filteredLow = searchQuery
    ? LOW_SEVERITY_CATEGORIES.filter((key) =>
        TRIGGER_CATEGORIES[key].name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : LOW_SEVERITY_CATEGORIES;

  onMount(async () => {
    console.log('[Options] onMount');
    initData();
  });

  async function initData() {
    // Attempt 1
    await loadData();
    if (activeProfile) return;

    // Attempt 2
    await new Promise((r) => setTimeout(r, 500));
    await loadData();
    if (activeProfile) return;

    // Attempt 3
    await new Promise((r) => setTimeout(r, 1000));
    await loadData();
  }

  async function loadData() {
    loading = true;
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject('Timeout'), 2000));

      const fetchProfile = new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({ type: 'GET_ACTIVE_PROFILE' }, (res) => {
            if (chrome.runtime.lastError) {
              console.warn(chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(res);
            }
          });
        } else {
          browser.runtime
            .sendMessage({ type: 'GET_ACTIVE_PROFILE' })
            .then(resolve)
            .catch(() => resolve(null));
        }
      });

      const response: any = await Promise.race([fetchProfile, timeout]);
      if (response && response.success) {
        activeProfile = response.data;
      }

      // Load all profiles (fire and forget)
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'GET_ALL_PROFILES' }, (res) => {
          if (res && res.success) allProfiles = res.data;
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      // Only turn off loading if we actually got data or if it's been a while?
      // Actually, for UI responsiveness, turn off loading but maybe show error if activeProfile is still null
      loading = false;
    }
  }

  async function toggleCategory(categoryKey: string) {
    if (!activeProfile) return;

    const isEnabled = activeProfile.enabledCategories.includes(categoryKey as any);
    const newCategories = isEnabled
      ? activeProfile.enabledCategories.filter((k) => k !== categoryKey)
      : [...activeProfile.enabledCategories, categoryKey as any];

    // Optimistic update
    activeProfile = { ...activeProfile, enabledCategories: newCategories };

    try {
      await updateProfileSilent({ enabledCategories: newCategories });
    } catch (e) {
      toast.error('Failed to save category');
    }
  }

  async function updateProfileSilent(updates: any) {
    if (!activeProfile) return;
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'UPDATE_PROFILE',
        profileId: activeProfile.id,
        updates,
      });
    }
  }

  async function updateProfile(updates: any) {
    saving = true;
    await updateProfileSilent(updates);
    setTimeout(() => (saving = false), 500);
    toast.success('Settings saved');
  }

  // Helper update functions
  function updateDisplay(key: string, value: any) {
    if (!activeProfile) return;
    updateProfile({ display: { ...activeProfile.display, [key]: value } });
  }
  function updateTheme(theme: Theme) {
    updateProfile({ theme });
  }
  function updateLeadTime(time: number) {
    updateProfile({ leadTime: time });
  }
  function toggleSound() {
    if (activeProfile) updateProfile({ soundEnabled: !activeProfile.soundEnabled });
  }
  function updateDefaultProtection(p: string) {
    updateProfile({ defaultProtection: p });
  }
  function updateHelperMode(enabled: boolean) {
    updateProfile({ helperMode: enabled });
  }

  function switchProfile(id: string) {
    loading = true;
    chrome.runtime.sendMessage({ type: 'SET_ACTIVE_PROFILE', profileId: id }, () => initData());
  }

  function isCategoryEnabled(key: string) {
    return activeProfile?.enabledCategories.includes(key as any) ?? false;
  }
</script>

<div class="options">
  <header class="options-header">
    <div class="container">
      <div class="header-content">
        <h1 class="header-title">
          <span class="header-icon">⚠️</span>
          Trigger Warnings Settings
        </h1>
        {#if saving}
          <span class="saving-indicator">Saving...</span>
        {/if}
      </div>
    </div>
  </header>

  <div class="container">
    {#if loading && !activeProfile}
      <div class="loading">Loading settings...</div>
    {:else if activeProfile}
      <div class="options-content">
        <!-- Tabs -->
        <nav class="tabs">
          <button
            class="tab"
            class:active={activeTab === 'categories'}
            on:click={() => (activeTab = 'categories')}>Categories</button
          >
          <button
            class="tab"
            class:active={activeTab === 'settings'}
            on:click={() => (activeTab = 'settings')}>Settings</button
          >
          <button
            class="tab"
            class:active={activeTab === 'stats'}
            on:click={() => (activeTab = 'stats')}>Stats</button
          >
        </nav>

        <!-- Categories -->
        {#if activeTab === 'categories'}
          <section class="section">
            <!-- Search -->
            <div class="search-box">
              <input
                type="text"
                placeholder="Search categories..."
                bind:value={searchQuery}
                class="search-input"
              />
              {#if searchQuery}
                <button class="search-clear" on:click={() => (searchQuery = '')}>✕</button>
              {/if}
            </div>

            {#if filteredHigh.length + filteredMedium.length + filteredLow.length === 0}
              <div class="no-results">No categories match "{searchQuery}"</div>
            {:else}
              <!-- High Severity -->
              {#if filteredHigh.length > 0}
                <div class="severity-group">
                  <h3 class="severity-header severity-high">
                    🔴 High Severity ({filteredHigh.length})
                  </h3>
                  <div class="categories-grid">
                    {#each filteredHigh as key}
                      {@const cat = TRIGGER_CATEGORIES[key]}
                      <button
                        class="category-card"
                        class:enabled={isCategoryEnabled(key)}
                        on:click={() => toggleCategory(key)}
                      >
                        <div class="category-icon">{cat.icon}</div>
                        <div class="category-info">
                          <div class="category-name">{cat.name}</div>
                        </div>
                        <div class="category-toggle">{isCategoryEnabled(key) ? '✓' : ''}</div>
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Medium Severity -->
              {#if filteredMedium.length > 0}
                <div class="severity-group">
                  <h3 class="severity-header severity-medium">
                    🟡 Medium Severity ({filteredMedium.length})
                  </h3>
                  <div class="categories-grid">
                    {#each filteredMedium as key}
                      {@const cat = TRIGGER_CATEGORIES[key]}
                      <button
                        class="category-card"
                        class:enabled={isCategoryEnabled(key)}
                        on:click={() => toggleCategory(key)}
                      >
                        <div class="category-icon">{cat.icon}</div>
                        <div class="category-info">
                          <div class="category-name">{cat.name}</div>
                        </div>
                        <div class="category-toggle">{isCategoryEnabled(key) ? '✓' : ''}</div>
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Low Severity -->
              {#if filteredLow.length > 0}
                <div class="severity-group">
                  <h3 class="severity-header severity-low">
                    🟢 Low Severity ({filteredLow.length})
                  </h3>
                  <div class="categories-grid">
                    {#each filteredLow as key}
                      {@const cat = TRIGGER_CATEGORIES[key]}
                      <button
                        class="category-card"
                        class:enabled={isCategoryEnabled(key)}
                        on:click={() => toggleCategory(key)}
                      >
                        <div class="category-icon">{cat.icon}</div>
                        <div class="category-info">
                          <div class="category-name">{cat.name}</div>
                        </div>
                        <div class="category-toggle">{isCategoryEnabled(key) ? '✓' : ''}</div>
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            {/if}
          </section>
        {/if}

        <!-- Settings -->
        {#if activeTab === 'settings'}
          <section class="section">
            <h2 class="section-title">Preferences</h2>
            <div class="setting-group">
              <div class="setting-label">Theme</div>
              <div class="theme-selector">
                <button class="theme-btn" on:click={() => updateTheme('light')}>Light</button>
                <button class="theme-btn" on:click={() => updateTheme('dark')}>Dark</button>
              </div>
            </div>
            <!-- Lead Time -->
            <div class="setting-group">
              <div class="setting-label">Warning Lead Time: {activeProfile.leadTime}s</div>
              <input
                type="range"
                min="5"
                max="60"
                value={activeProfile.leadTime}
                on:change={(e) => updateLeadTime(Number(e.currentTarget.value))}
              />
            </div>
          </section>
        {/if}

        <!-- Stats -->
        {#if activeTab === 'stats'}
          <Stats />
        {/if}
      </div>
    {:else}
      <div class="error">
        Failed to load settings.
        <button on:click={initData}>Retry</button>
      </div>
    {/if}
  </div>
  <ToastContainer />
</div>

<style>
  .options {
    min-height: 100vh;
    background: #f5f7fa;
    font-family: system-ui, sans-serif;
  }
  .options-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px 0;
  }
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 20px;
  }
  .header-title {
    font-size: 24px;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .tabs {
    display: flex;
    gap: 20px;
    margin: 30px 0;
    border-bottom: 1px solid #ddd;
  }
  .tab {
    background: none;
    border: none;
    padding: 10px 0;
    cursor: pointer;
    font-size: 16px;
    color: #666;
    border-bottom: 2px solid transparent;
  }
  .tab.active {
    color: #667eea;
    border-bottom-color: #667eea;
    font-weight: 600;
  }
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  .category-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
  }
  .category-card.enabled {
    border-color: #667eea;
    background: #f8f9ff;
  }
  .category-icon {
    font-size: 24px;
  }
  .category-name {
    font-weight: 600;
    color: #333;
  }
  .category-toggle {
    font-weight: bold;
    color: #667eea;
    margin-left: auto;
  }
  .theme-selector {
    display: flex;
    gap: 10px;
  }
  .theme-btn {
    padding: 10px 20px;
    background: white;
    border: 1px solid #ddd;
    cursor: pointer;
    border-radius: 6px;
  }
  .loading,
  .error {
    padding: 40px;
    text-align: center;
    color: #666;
  }
  .setting-group {
    margin-bottom: 20px;
  }
  .setting-label {
    font-weight: 600;
    margin-bottom: 8px;
  }
  /* Severity grouping */
  .severity-group {
    margin-bottom: 24px;
  }
  .severity-header {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 12px 0;
    padding: 8px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .severity-high {
    background: #fee2e2;
    color: #991b1b;
  }
  .severity-medium {
    background: #fef3c7;
    color: #92400e;
  }
  .severity-low {
    background: #dcfce7;
    color: #166534;
  }
  /* Search box */
  .search-box {
    position: relative;
    margin-bottom: 20px;
  }
  .search-input {
    width: 100%;
    padding: 12px 40px 12px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
  }
  .search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  .search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 16px;
    color: #888;
    cursor: pointer;
  }
  .no-results {
    padding: 40px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
</style>
