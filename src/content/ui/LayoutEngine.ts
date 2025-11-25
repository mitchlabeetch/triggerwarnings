import { IStreamingProvider } from "@shared/types/Provider.types";
import { createLogger } from "@shared/utils/logger";

const logger = createLogger('LayoutEngine');

// Selectors for the main control container (for the dock)
const DOCK_CONTAINER_SELECTORS: { [key: string]: string } = {
    'YouTube': '.ytp-chrome-bottom',
    'Netflix': '.watch-video--player-controls-container',
};

// Selectors for the progress bar itself (for the timeline)
const TIMELINE_SELECTORS: { [key: string]: string } = {
    'YouTube': '.ytp-progress-bar-container',
    'Netflix': 'div[data-uia="scrubber-container"]',
};

export class LayoutEngine {
    private provider: IStreamingProvider;
    private dockObserver: ResizeObserver | null = null;
    private timelineObserver: ResizeObserver | null = null;
    private dockTarget: HTMLElement | null = null;
    private timelineTarget: HTMLElement | null = null;

    constructor(provider: IStreamingProvider) {
        this.provider = provider;
    }

    public initialize(): void {
        this.observe(DOCK_CONTAINER_SELECTORS, (element) => this.updateDockOffset(element), 'dock');
        this.observe(TIMELINE_SELECTORS, (element) => this.updateTimelineOffset(element), 'timeline');
    }

    private observe(selectors: { [key: string]: string }, updateCallback: (element: HTMLElement) => void, name: 'dock' | 'timeline'): void {
        const selector = selectors[this.provider.name];
        if (!selector) {
            logger.warn(`No native UI selector found for ${name} on platform: ${this.provider.name}`);
            return;
        }

        const targetElement = document.querySelector<HTMLElement>(selector);

        if (targetElement) {
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    updateCallback(entry.target as HTMLElement);
                }
            });
            observer.observe(targetElement);
            updateCallback(targetElement); // Initial update

            if (name === 'dock') {
                this.dockTarget = targetElement;
                this.dockObserver = observer;
            } else {
                this.timelineTarget = targetElement;
                this.timelineObserver = observer;
            }
            logger.info(`Observing ${name} UI element: ${selector}`);
        } else {
            logger.warn(`Could not find native UI element for ${name} with selector: ${selector}`);
        }
    }

    private updateDockOffset(element: HTMLElement): void {
        const rect = element.getBoundingClientRect();
        const offset = window.innerHeight - rect.top;
        document.documentElement.style.setProperty('--tw-dock-bottom-offset', `${offset}px`);
    }

    private updateTimelineOffset(element: HTMLElement): void {
        const rect = element.getBoundingClientRect();
        const offset = window.innerHeight - rect.top;
        document.documentElement.style.setProperty('--tw-timeline-bottom-offset', `${offset}px`);
    }

    public dispose(): void {
        if (this.dockObserver && this.dockTarget) {
            this.dockObserver.unobserve(this.dockTarget);
        }
        if (this.timelineObserver && this.timelineTarget) {
            this.timelineObserver.unobserve(this.timelineTarget);
        }

        document.documentElement.style.removeProperty('--tw-dock-bottom-offset');
        document.documentElement.style.removeProperty('--tw-timeline-bottom-offset');
        logger.info('Disposed and cleaned up LayoutEngine.');
    }
}
