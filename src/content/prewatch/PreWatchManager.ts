/**
 * PRE-WATCH MANAGER
 *
 * Manages the pre-watch safety screen lifecycle.
 * Responsible for:
 * - Pausing video on content detection
 * - Showing the pre-watch safety screen
 * - Loading trigger data from database
 * - Handling skip and complete actions
 * - Transitioning to watching mode
 */

import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { MediaTriggerData, PreWatchCase } from '@shared/types/MediaContent.types';
import type { TriggerCategory, StreamingPlatform } from '@shared/types/Warning.types';
import type { Profile } from '@shared/types/Profile.types';
import { createContainer, injectContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import { triggerDatabaseService } from '@database/services/TriggerDatabaseService';
import browser from 'webextension-polyfill';
import PreWatchSafetyScreen from './PreWatchSafetyScreen.svelte';

const logger = createLogger('PreWatchManager');

/**
 * Configuration for the pre-watch screen
 */
interface PreWatchConfig {
  /** Minimum display duration in seconds */
  minDuration: number;
  /** Whether to auto-play after countdown */
  autoPlay: boolean;
  /** Whether pre-watch screen is enabled */
  enabled: boolean;
}

/**
 * Callbacks for pre-watch events
 */
interface PreWatchCallbacks {
  onComplete?: () => void;
  onSkip?: () => void;
  onError?: (error: Error) => void;
}

/**
 * PreWatchManager
 * Manages the pre-watch safety screen and its lifecycle
 */
export class PreWatchManager {
  private provider: IStreamingProvider;
  private container: HTMLDivElement | null = null;
  private component: PreWatchSafetyScreen | null = null;
  private triggerData: MediaTriggerData | null = null;
  private preWatchCase: PreWatchCase = 'no-data';
  private isShowing = false;
  private hasCompleted = false;

  // Configuration
  private config: PreWatchConfig = {
    minDuration: 10,
    autoPlay: true,
    enabled: true,
  };

  // Profile data
  private profileName = 'Default';
  private userCategories: TriggerCategory[] = [];

  // Callbacks
  private onCompleteCallback: (() => void) | null = null;
  private onSkipCallback: (() => void) | null = null;

  constructor(provider: IStreamingProvider) {
    this.provider = provider;
  }

  /**
   * Initialize the pre-watch manager
   */
  async initialize(): Promise<void> {
    logger.info('Initializing PreWatchManager...');

    try {
      // Load profile settings
      await this.loadProfileSettings();

      // Initialize database service if needed
      if (!triggerDatabaseService.isInitialized()) {
        await triggerDatabaseService.initialize();
      }

      logger.info('PreWatchManager initialized');
    } catch (error) {
      logger.error('Failed to initialize PreWatchManager:', error);
    }
  }

  /**
   * Load profile settings from storage
   */
  private async loadProfileSettings(): Promise<void> {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'GET_ACTIVE_PROFILE',
      });

      if (response.success && response.data) {
        const profile: Profile = response.data;
        this.profileName = profile.name;
        // Use enabledCategories (primary) or triggers (alias) with fallback to empty array
        this.userCategories = profile.enabledCategories || profile.triggers || [];

        // Load pre-watch specific settings if available
        if (profile.display) {
          this.config.minDuration = profile.display.preWatchDuration ?? 10;
          this.config.enabled = profile.display.showPreWatchScreen ?? true;
        }

        logger.debug('Profile settings loaded:', {
          name: this.profileName,
          triggers: this.userCategories.length,
          preWatchDuration: this.config.minDuration,
        });
      }
    } catch (error) {
      logger.error('Failed to load profile settings:', error);
    }
  }

  /**
   * Show the pre-watch safety screen
   * This is the main entry point when a video is detected
   */
  async show(
    platform: StreamingPlatform,
    platformVideoId: string,
    callbacks?: PreWatchCallbacks
  ): Promise<void> {
    // Check if pre-watch is disabled
    if (!this.config.enabled) {
      logger.info('Pre-watch screen disabled, skipping...');
      callbacks?.onComplete?.();
      return;
    }

    // Prevent multiple shows
    if (this.isShowing) {
      logger.warn('Pre-watch screen already showing');
      return;
    }

    this.isShowing = true;
    this.hasCompleted = false;
    this.onCompleteCallback = callbacks?.onComplete || null;
    this.onSkipCallback = callbacks?.onSkip || null;

    logger.info('Showing pre-watch safety screen for:', { platform, platformVideoId });

    try {
      // 1. Pause the video immediately
      this.pauseVideo();

      // 2. Fetch trigger data from database
      this.triggerData = await triggerDatabaseService.getTriggerData(
        platform,
        platformVideoId,
        this.userCategories.length > 0 ? this.userCategories : undefined
      );

      // 3. Determine which case to display
      this.preWatchCase = triggerDatabaseService.getPreWatchCase(
        this.triggerData,
        this.userCategories.length > 0 ? this.userCategories : undefined
      );

      logger.info('Pre-watch case:', this.preWatchCase, {
        hasData: this.triggerData?.hasAnyData,
        hasOverall: this.triggerData?.hasOverallTriggers,
        hasTimestamps: this.triggerData?.hasTimestamps,
        triggeredCategories: this.triggerData?.triggeredCategories.length,
      });

      // 4. Create and show the screen
      this.createScreen();
    } catch (error) {
      logger.error('Error showing pre-watch screen:', error);
      this.isShowing = false;

      if (callbacks?.onError) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      } else {
        // Fallback: just play the video
        this.handleComplete();
      }
    }
  }

  /**
   * Pause the video element
   */
  private pauseVideo(): void {
    const video = this.provider.getVideoElement();
    if (video && !video.paused) {
      video.pause();
      logger.debug('Video paused for pre-watch screen');
    }
  }

  /**
   * Play the video element
   */
  private playVideo(): void {
    const video = this.provider.getVideoElement();
    if (video && video.paused) {
      video.play().catch((err) => {
        logger.warn('Failed to auto-play video:', err);
      });
      logger.debug('Video playback resumed');
    }
  }

  /**
   * Create and mount the pre-watch screen component
   */
  private createScreen(): void {
    // Create container
    this.container = createContainer('tw-prewatch-container', 'tw-prewatch-root');

    // Inject into DOM (use body for fullscreen overlay)
    injectContainer(this.container, document.body);
    logger.debug('Pre-watch container injected');

    // Mount Svelte component
    this.component = new PreWatchSafetyScreen({
      target: this.container,
      props: {
        triggerData: this.triggerData!,
        preWatchCase: this.preWatchCase,
        userCategories: this.userCategories,
        profileName: this.profileName,
        minDuration: this.config.minDuration,
        onComplete: () => this.handleComplete(),
        onSkip: () => this.handleSkip(),
        onOpenSettings: () => this.handleOpenSettings(),
      },
    });

    // Listen for component events
    this.component.$on('complete', () => this.handleComplete());
    this.component.$on('skip', () => this.handleSkip());
    this.component.$on('openSettings', () => this.handleOpenSettings());
    this.component.$on('dismissed', () => this.cleanup());

    logger.info('Pre-watch screen component mounted');
  }

  /**
   * Handle pre-watch screen completion (countdown finished)
   */
  private handleComplete(): void {
    if (this.hasCompleted) return;
    this.hasCompleted = true;

    logger.info('Pre-watch screen completed');

    // Resume video playback
    if (this.config.autoPlay) {
      this.playVideo();
    }

    // Trigger callback
    this.onCompleteCallback?.();

    // Cleanup will be triggered by dismissed event
  }

  /**
   * Handle skip button click
   */
  private handleSkip(): void {
    if (this.hasCompleted) return;
    this.hasCompleted = true;

    logger.info('Pre-watch screen skipped');

    // Resume video playback
    this.playVideo();

    // Trigger callback
    this.onSkipCallback?.();
    this.onCompleteCallback?.();

    // Cleanup will be triggered by dismissed event
  }

  /**
   * Handle settings button click
   */
  private handleOpenSettings(): void {
    logger.debug('Opening settings...');

    // Send message to open options page
    browser.runtime
      .sendMessage({
        type: 'OPEN_OPTIONS_PAGE',
      })
      .catch((err) => {
        logger.error('Failed to open settings:', err);
      });
  }

  /**
   * Cleanup the pre-watch screen
   */
  private cleanup(): void {
    logger.debug('Cleaning up pre-watch screen...');

    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }

    this.isShowing = false;
    logger.info('Pre-watch screen cleanup complete');
  }

  /**
   * Force dismiss the pre-watch screen
   */
  dismiss(): void {
    if (!this.isShowing) return;

    logger.info('Forcing pre-watch screen dismiss');
    this.handleComplete();
    this.cleanup();
  }

  /**
   * Get the current trigger data
   */
  getTriggerData(): MediaTriggerData | null {
    return this.triggerData;
  }

  /**
   * Get the current pre-watch case
   */
  getPreWatchCase(): PreWatchCase {
    return this.preWatchCase;
  }

  /**
   * Check if the screen is currently showing
   */
  isVisible(): boolean {
    return this.isShowing;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<PreWatchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Register callback for when pre-watch completes
   */
  onComplete(callback: () => void): void {
    this.onCompleteCallback = callback;
  }

  /**
   * Register callback for when user skips
   */
  onSkip(callback: () => void): void {
    this.onSkipCallback = callback;
  }

  /**
   * Dispose of the manager
   */
  dispose(): void {
    logger.info('Disposing PreWatchManager...');
    this.cleanup();
    this.triggerData = null;
    this.onCompleteCallback = null;
    this.onSkipCallback = null;
  }
}
