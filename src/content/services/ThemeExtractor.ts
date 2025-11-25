import { IStreamingProvider } from "@shared/types/Provider.types";
import { createLogger } from "@shared/utils/logger";

const logger = createLogger('ThemeExtractor');

export class ThemeExtractor {
    private provider: IStreamingProvider;
    private intervalId: number | null = null;
    private offscreenCanvas: OffscreenCanvas | null = null;
    private offscreenContext: OffscreenCanvasRenderingContext2D | null = null;

    constructor(provider: IStreamingProvider) {
        this.provider = provider;
        // Initialize the OffscreenCanvas once
        this.offscreenCanvas = new OffscreenCanvas(1, 1);
        this.offscreenContext = this.offscreenCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | null;

        if (!this.offscreenContext) {
            logger.error('Failed to get OffscreenCanvas context.');
        }
    }

    public initialize(): void {
        if (!this.offscreenContext) {
            logger.warn('ThemeExtractor cannot start without a valid OffscreenCanvas context.');
            return;
        }

        // Start sampling every 5 seconds
        this.intervalId = window.setInterval(() => this.sampleVideoFrame(), 5000);
        logger.info('Initialized and started color sampling.');
    }

    private async sampleVideoFrame(): Promise<void> {
        const videoElement = this.provider.getVideoElement();
        if (!videoElement || videoElement.readyState < 2 || !this.offscreenContext || !this.offscreenCanvas) {
            return; // Video not ready or context not available
        }

        try {
            // Draw the center of the video to the 1x1 offscreen canvas
            const centerX = videoElement.videoWidth / 2;
            const centerY = videoElement.videoHeight / 2;
            this.offscreenContext.drawImage(videoElement, centerX, centerY, 1, 1, 0, 0, 1, 1);

            // Get the pixel data
            const imageData = this.offscreenContext.getImageData(0, 0, 1, 1).data;
            const [r, g, b] = imageData;

            const accentColor = `rgb(${r}, ${g}, ${b})`;

            // Update the CSS variable on the root element
            document.documentElement.style.setProperty('--tw-accent-color', accentColor);
            logger.log(`Updated accent color: ${accentColor}`);

        } catch (error) {
            // This can happen due to CORS issues with the video element
            if (error instanceof DOMException && error.name === 'SecurityError') {
                logger.warn('Cannot sample video frame due to CORS policy. Disabling ThemeExtractor.');
                this.dispose(); // Stop trying if we hit a security wall
            } else {
                logger.error('Error sampling video frame:', error);
            }
        }
    }

    public dispose(): void {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
        // Reset the CSS variable
        document.documentElement.style.removeProperty('--tw-accent-color');
        logger.info('Disposed and cleaned up ThemeExtractor.');
    }
}
