import { IStreamingProvider } from "@shared/types/Provider.types";
import { createLogger } from "@shared/utils/logger";

const logger = createLogger('LayoutEngine');

export class LayoutEngine {
    private provider: IStreamingProvider;
    private observer: MutationObserver | null = null;

    constructor(provider: IStreamingProvider) {
        this.provider = provider;
    }

    public initialize(): void {
        logger.info(`Initializing for ${this.provider.name}...`);
        this.startObserver();
    }

    private startObserver(): void {
        const targetNode = this.provider.getInjectionPoint();
        if (!targetNode) {
            logger.warn('Could not find target node for LayoutEngine observer');
            return;
        }

        this.observer = new MutationObserver(() => {
            this.updateLayout();
        });

        this.observer.observe(targetNode, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        // Initial update
        this.updateLayout();
    }

    private updateLayout(): void {
        const nativeControls = this.findNativeControls();
        if (nativeControls) {
            const { bottom } = nativeControls.getBoundingClientRect();
            const offset = window.innerHeight - bottom;
            document.documentElement.style.setProperty('--tw-dock-bottom-offset', `${offset}px`);
        }
    }

    private findNativeControls(): HTMLElement | null {
        const selectors = this.getPlatformSelectors();
        if (!selectors) {
            return null;
        }

        for (const selector of selectors) {
            const element = document.querySelector(selector) as HTMLElement;
            if (element) {
                return element;
            }
        }

        return null;
    }

    private getPlatformSelectors(): string[] | null {
        switch (this.provider.name) {
            case 'Netflix':
                return ['.PlayerControls--bottom-controls'];
            case 'YouTube':
                return ['.ytp-chrome-bottom'];
            // Add other platforms here...
            default:
                return null;
        }
    }

    public dispose(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}
