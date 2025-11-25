import { IStreamingProvider } from "@shared/types/Provider.types";
import { MediaInfo } from "@shared/types/Provider.types";
import { createLogger } from "@shared/utils/logger";
import { ImageLoader } from "../utils/ImageLoader";

const logger = createLogger('ThemeExtractor');

export class ThemeExtractor {
    private provider: IStreamingProvider;

    constructor(provider: IStreamingProvider) {
        this.provider = provider;
    }

    public initialize(): void {
        logger.info(`Initializing for ${this.provider.name}...`);
        this.provider.getCurrentMedia().then(media => {
            if (media) {
                this.onMediaChange(media);
            }
        });
    }

    public async onMediaChange(media: MediaInfo): Promise<void> {
        if (!media.thumbnailUrl) {
            logger.warn('No thumbnail URL available for media:', media.title);
            return;
        }

        try {
            const dataUrl = await ImageLoader.fetchDataUrl(media.thumbnailUrl);
            const dominantColor = await this.extractDominantColor(dataUrl);
            document.documentElement.style.setProperty('--tw-accent-color', dominantColor);
            logger.info(`Set accent color to ${dominantColor} for ${media.title}`);
        } catch (error) {
            logger.error('Failed to extract dominant color from thumbnail:', error);
        }
    }

    private extractDominantColor(imageUrl: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = new OffscreenCanvas(img.width, img.height);
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject('Could not get canvas context');
                }

                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, img.width, img.height).data;

                const colorCounts: { [key: string]: number } = {};
                let maxCount = 0;
                let dominantColor = '';

                for (let i = 0; i < imageData.length; i += 4) {
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    const rgb = `${r},${g},${b}`;

                    colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;

                    if (colorCounts[rgb] > maxCount) {
                        maxCount = colorCounts[rgb];
                        dominantColor = rgb;
                    }
                }

                resolve(`rgb(${dominantColor})`);
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    public dispose(): void {
        // No-op
    }
}
