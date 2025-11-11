/**
 * Active Indicator Manager
 * Manages the "TW Active" indicator overlay and quick-add functionality
 */
import { createContainer, injectContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import { ProfileManager } from '@core/profiles/ProfileManager';
import ActiveIndicator from './ActiveIndicator.svelte';
const logger = createLogger('ActiveIndicatorManager');
export class ActiveIndicatorManager {
    provider;
    container = null;
    indicatorComponent = null;
    activeWarnings = [];
    onQuickAddCallback = null;
    constructor(provider) {
        this.provider = provider;
    }
    async initialize() {
        logger.info('Initializing active indicator...');
        // Load active profile for customization settings
        const profile = await ProfileManager.getActive();
        // Extract overlay customization from profile (with fallback defaults)
        const overlaySettings = profile.display?.overlaySettings || {};
        const buttonColor = overlaySettings.buttonColor || '#8b5cf6';
        const buttonOpacity = overlaySettings.buttonOpacity !== undefined ? overlaySettings.buttonOpacity : 0.45;
        const appearingMode = overlaySettings.appearingMode || 'always';
        const fadeOutDelay = overlaySettings.fadeOutDelay || 3000;
        logger.info('Overlay customization:', { buttonColor, buttonOpacity, appearingMode, fadeOutDelay });
        // Create container for indicator
        this.container = createContainer('tw-indicator-container', 'tw-indicator-root');
        // Inject into DOM
        const injectionPoint = this.provider.getInjectionPoint();
        injectContainer(this.container, injectionPoint || undefined);
        // Mount Svelte component with customization
        this.indicatorComponent = new ActiveIndicator({
            target: this.container,
            props: {
                onQuickAdd: () => this.handleQuickAdd(),
                activeWarnings: this.activeWarnings,
                buttonColor,
                buttonOpacity,
                appearingMode,
                fadeOutDelay,
            },
        });
        logger.info('Active indicator initialized with custom settings');
    }
    /**
     * Update active warnings display
     */
    updateActiveWarnings(warnings) {
        this.activeWarnings = warnings;
        if (this.indicatorComponent) {
            this.indicatorComponent.$set({ activeWarnings: warnings });
        }
    }
    handleQuickAdd() {
        logger.info('Quick add trigger requested');
        if (this.onQuickAddCallback) {
            this.onQuickAddCallback();
        }
    }
    /**
     * Set callback for quick add button
     */
    onQuickAdd(callback) {
        this.onQuickAddCallback = callback;
    }
    /**
     * Show the indicator
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }
    /**
     * Hide the indicator
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    dispose() {
        logger.info('Disposing active indicator...');
        if (this.indicatorComponent) {
            this.indicatorComponent.$destroy();
            this.indicatorComponent = null;
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }
    }
}
//# sourceMappingURL=ActiveIndicatorManager.js.map