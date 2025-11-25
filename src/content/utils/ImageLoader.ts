import { createLogger } from "@shared/utils/logger";

const logger = createLogger('ImageLoader');

export class ImageLoader {
    public static async fetchDataUrl(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            logger.error(`Failed to fetch image data for url: ${url}`, error);
            throw error;
        }
    }
}
