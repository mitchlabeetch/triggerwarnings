import type { IStreamingProvider } from "@shared/types/Provider.types";
import type { ActiveWarning } from "@shared/types/Warning.types";
import TriggerTimeline from "./TriggerTimeline.svelte";
import { createLogger } from "@shared/utils/logger";

const logger = createLogger('TriggerTimelineManager');

export class TriggerTimelineManager {
    private provider: IStreamingProvider;
    private component: TriggerTimeline | null = null;
    private target: HTMLElement | null = null;

    constructor(provider: IStreamingProvider) {
        this.provider = provider;
    }

    public initialize(): void {
        const progressBar = this.provider.getProgressBar();
        if (progressBar) {
            this.target = document.createElement('div');
            this.target.id = 'tw-timeline-root';
            progressBar.appendChild(this.target);

            this.component = new TriggerTimeline({
                target: this.target,
                props: {
                    provider: this.provider,
                    warnings: [],
                }
            });
            logger.info('Initialized');
        } else {
            logger.warn('Progress bar not found');
        }
    }

    public updateWarnings(warnings: ActiveWarning[]): void {
        if (this.component) {
            this.component.$set({ warnings });
        }
    }

    public dispose(): void {
        if (this.component) {
            this.component.$destroy();
        }
        if (this.target) {
            this.target.remove();
        }
    }
}
