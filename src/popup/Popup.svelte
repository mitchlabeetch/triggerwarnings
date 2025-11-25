<script lang="ts">
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import type { Profile } from '@shared/types/Profile.types';
  import SubmitWarning from './components/SubmitWarning.svelte';
  import ProfileCreate from './components/ProfileCreate.svelte';
  import ProfileRename from './components/ProfileRename.svelte';
  import ProfileDelete from './components/ProfileDelete.svelte';

  // Init with explicit null/false to ensure UI renders immediately
  let activeProfile: Profile | null = null;
  let allProfiles: Profile[] = [];
  let loading = false; 
  let error: string | null = null;
  let debugLog = 'Svelte Init...';

  // Modal states
  let showSubmitForm = false;
  let showCreateProfile = false;
  let showRenameProfile = false;
  let showDeleteProfile = false;
  
  let profileToEdit: Profile | null = null;
  let currentVideoId: string | null = null;
  let currentTime = 0;

  function log(msg: string) {
    console.log(`[Popup] ${msg}`);
    // debugLog += `\n${msg}`;
  }

  onMount(async () => {
    log('onMount');
    
    // Failsafe: verify Svelte is reactive
    setTimeout(() => {
      if (!activeProfile && !error) {
        log('Failsafe: No profile loaded after 1s');
      }
    }, 1000);

    initData();
    checkCurrentVideo();
  });

  async function initData() {
    loading = true;
    try {
      // Use direct chrome API for reliability
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'GET_ACTIVE_PROFILE' }, (response) => {
          if (chrome.runtime.lastError) {
            error = chrome.runtime.lastError.message || 'Runtime Error';
            loading = false;
            return;
          }
          if (response && response.success) {
            activeProfile = response.data;
            log(`Loaded: ${activeProfile?.name}`);
          } else {
            error = 'Failed to load profile';
          }
          loading = false;
        });

        // Fetch all profiles in background
        chrome.runtime.sendMessage({ type: 'GET_ALL_PROFILES' }, (res) => {
          if (res && res.success) allProfiles = res.data;
        });
      } else {
        // Fallback
        error = 'Chrome API not available';
        loading = false;
      }
    } catch (e) {
      error = String(e);
      loading = false;
    }
  }

  async function checkCurrentVideo() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          const url = tabs[0].url;
          if (url.includes('youtube.com/watch')) {
            const match = url.match(new RegExp('v=([^&]+)'));
            if (match) currentVideoId = match[1];
          } else if (url.includes('netflix.com/watch')) {
            const match = url.match(new RegExp('watch/(\d+)'));
            if (match) currentVideoId = match[1];
          }
        }
      });
    }
  }

  // Actions
  function switchProfile(id: string) {
    loading = true;
    chrome.runtime.sendMessage({ type: 'SET_ACTIVE_PROFILE', profileId: id }, (res) => {
      if (res && res.success) initData();
      else loading = false;
    });
  }

  function openOptions() {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else window.open('options.html');
  }

  // Modal Handlers
  function openSubmitForm() { showSubmitForm = true; }
  function closeSubmitForm() { showSubmitForm = false; }
  
  function openCreateProfile() { showCreateProfile = true; }
  function closeCreateProfile() { showCreateProfile = false; }
  
  function openRenameProfile(p: Profile) { profileToEdit = p; showRenameProfile = true; }
  function closeRenameProfile() { showRenameProfile = false; profileToEdit = null; }
  
  function openDeleteProfile(p: Profile) { profileToEdit = p; showDeleteProfile = true; }
  function closeDeleteProfile() { showDeleteProfile = false; profileToEdit = null; }

  function handleProfileChange() { initData(); }

  function handleKeydown(e: KeyboardEvent, cb: () => void) {
    if (e.key === 'Escape') cb();
  }
</script>

<div class="popup">
  <header class="popup-header">
    <div class="popup-logo">
      <span class="popup-icon">⚠️</span>
      <h1 class="popup-title">Trigger Warnings</h1>
    </div>
  </header>

  {#if error}
    <div class="popup-error">
      <p>Error: {error}</p>
      <button class="btn btn-secondary" on:click={initData}>Retry</button>
    </div>
  {:else if loading && !activeProfile}
    <div class="popup-loading">Loading...</div>
  {:else if activeProfile}
    <div class="popup-content">
      <!-- Active Profile -->
      <section class="popup-section">
        <div class="section-header">
          <h2 class="section-title">Active Profile</h2>
          <button class="btn-icon" on:click={openCreateProfile} title="Create new profile">
            ➕
          </button>
        </div>
        <div class="profile-card active">
          <div class="profile-info">
            <span class="profile-name">{activeProfile.name}</span>
            <span class="profile-stats">
              {activeProfile.enabledCategories.length} categories enabled
            </span>
          </div>
          <div class="profile-actions">
            <button class="btn-icon-small" on:click={() => openRenameProfile(activeProfile)} title="Rename">✏️</button>
            {#if allProfiles.length > 1}
              <button class="btn-icon-small" on:click={() => openDeleteProfile(activeProfile)} title="Delete">🗑️</button>
            {/if}
          </div>
        </div>
      </section>

      <!-- Switch Profile -->
      {#if allProfiles.length > 1}
        <section class="popup-section">
          <h2 class="section-title">Switch Profile</h2>
          <div class="profile-list">
            {#each allProfiles as profile}
              {#if profile.id !== activeProfile.id}
                <button class="profile-card" on:click={() => switchProfile(profile.id)}>
                  <div class="profile-info">
                    <span class="profile-name">{profile.name}</span>
                    <span class="profile-stats">
                      {profile.enabledCategories.length} categories
                    </span>
                  </div>
                </button>
              {/if}
            {/each}
          </div>
        </section>
      {/if}

      <!-- Actions -->
      <section class="popup-section">
        {#if currentVideoId}
          <button class="btn btn-secondary" on:click={openSubmitForm}>
            <span>➕</span> Submit Warning
          </button>
        {/if}
        <button class="btn btn-primary" on:click={openOptions}>
          <span>⚙️</span> Settings & Customization
        </button>
      </section>

      <footer class="popup-footer">
        <p class="popup-info">
          Monitoring {currentVideoId ? 'current video' : 'supported platforms'}.
        </p>
      </footer>
    </div>
  {:else}
    <div class="popup-error">
      No profile loaded.
      <button class="btn btn-secondary" on:click={initData}>Retry</button>
    </div>
  {/if}

  <!-- Modals -->
  {#if showSubmitForm}
    <div class="modal-overlay" role="dialog" aria-modal="true" on:click={closeSubmitForm} on:keydown={(e) => handleKeydown(e, closeSubmitForm)}>
      <div class="modal-content" on:click|stopPropagation role="document" tabindex="-1">
        <SubmitWarning onClose={closeSubmitForm} videoId={currentVideoId} currentTime={currentTime} />
      </div>
    </div>
  {/if}

  {#if showCreateProfile}
    <div class="modal-overlay" role="dialog" aria-modal="true" on:click={closeCreateProfile} on:keydown={(e) => handleKeydown(e, closeCreateProfile)}>
      <div class="modal-content" on:click|stopPropagation role="document" tabindex="-1">
        <ProfileCreate onClose={closeCreateProfile} onSuccess={handleProfileChange} profiles={allProfiles} />
      </div>
    </div>
  {/if}

  {#if showRenameProfile && profileToEdit}
    <div class="modal-overlay" role="dialog" aria-modal="true" on:click={closeRenameProfile} on:keydown={(e) => handleKeydown(e, closeRenameProfile)}>
      <div class="modal-content" on:click|stopPropagation role="document" tabindex="-1">
        <ProfileRename onClose={closeRenameProfile} onSuccess={handleProfileChange} profile={profileToEdit} allProfiles={allProfiles} />
      </div>
    </div>
  {/if}

  {#if showDeleteProfile && profileToEdit}
    <div class="modal-overlay" role="dialog" aria-modal="true" on:click={closeDeleteProfile} on:keydown={(e) => handleKeydown(e, closeDeleteProfile)}>
      <div class="modal-content" on:click|stopPropagation role="document" tabindex="-1">
        <ProfileDelete onClose={closeDeleteProfile} onSuccess={handleProfileChange} profile={profileToEdit} />
      </div>
    </div>
  {/if}
</div>

<style>
  .popup { width: 320px; max-height: 600px; overflow-y: auto; font-family: system-ui, sans-serif; background: #f8f9fa; }
  .popup-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; color: white; }
  .popup-logo { display: flex; align-items: center; gap: 12px; }
  .popup-icon { font-size: 32px; }
  .popup-title { margin: 0; font-size: 20px; font-weight: 600; }
  .popup-content { padding: 10px; }
  .popup-section { margin-bottom: 12px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .section-title { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; margin: 0; }
  
  .profile-card { background: white; border: 2px solid transparent; border-radius: 8px; padding: 10px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .profile-card.active { border-color: #667eea; background: #f0f4ff; cursor: default; }
  .profile-info { display: flex; flex-direction: column; flex: 1; }
  .profile-name { font-weight: 600; color: #222; }
  .profile-stats { font-size: 12px; color: #666; }
  .profile-actions { display: flex; gap: 4px; }
  .profile-list { display: flex; flex-direction: column; gap: 8px; }

  .btn { width: 100%; padding: 8px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
  .btn-secondary { background: white; color: #667eea; border: 1px solid #667eea; }
  
  .btn-icon, .btn-icon-small { background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .btn-icon { width: 24px; height: 24px; font-size: 14px; }
  .btn-icon-small { width: 28px; height: 28px; font-size: 14px; }

  .popup-footer { border-top: 1px solid #eee; padding-top: 12px; margin-top: 12px; text-align: center; font-size: 11px; color: #888; }
  .popup-loading, .popup-error { padding: 40px; text-align: center; color: #666; }
  .popup-error { color: #dc2626; }

  /* Modal */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal-content { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); width: 90%; max-width: 280px; overflow: hidden; }
</style>