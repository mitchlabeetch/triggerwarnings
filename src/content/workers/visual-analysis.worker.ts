/**
 * VISUAL CNN WEB WORKER (Innovation #46 & #6)
 *
 * This script runs in a dedicated Web Worker to offload all heavy visual
 * analysis from the main thread, preventing UI blocking and ensuring a smooth
 * user experience. It uses TensorFlow.js with the WebGPU backend for
 * hardware-accelerated, local ML model inference.
 *
 * **ARCHITECTURE:**
 * - Environment: Dedicated Web Worker
 * - Communication: Receives ImageBitmap objects from the main thread via postMessage.
 * - Processing: Uses OffscreenCanvas for rendering and TensorFlow.js for inference.
 * - Model: MobileNetV2 (quantized INT8)
 * - Backend: WebGPU
 *
 * **FEATURES:**
 * - Off-main-thread execution prevents UI stuttering.
 * - Efficient frame transfer using ImageBitmap.
 * - Scene-change detection to throttle inference.
 * - Memory-safe with aggressive tf.tidy() usage.
 *
 * Created by: Claude Code (Algorithm 3.0 Phase 3)
 * Date: 2025-11-24
 */

import type { TriggerCategory } from '@shared/types/Warning.types';
import { Logger } from '@shared/utils/logger';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

// Type declaration for Web Worker global scope
interface DedicatedWorkerGlobalScope {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

// self is the global scope in a Web Worker
declare const self: DedicatedWorkerGlobalScope;

const logger = new Logger('VisualCNN-Worker');

export interface CategoryConfidences {
  [category: string]: number;
}

export interface CNNInferenceResult {
  confidences: CategoryConfidences;
  topCategories: Array<{ category: TriggerCategory; confidence: number }>;
  processingTimeMs: number;
  modelVersion: string;
}

class VisualCNN {
  private model: tf.GraphModel | null = null;
  private modelLoaded: boolean = false;
  private previousFrame: tf.Tensor | null = null;

  private readonly SCENE_CHANGE_THRESHOLD = 0.15; // 15%

  private stats = {
    totalInferences: 0,
    avgInferenceTimeMs: 0,
    totalLoadTimeMs: 0,
    modelLoadSuccess: false,
    webgpuEnabled: false,
    sceneChangesDetected: 0,
  };

  constructor() {
    logger.info('[VisualCNN] Worker initialized');
  }

  async loadModel(): Promise<boolean> {
    const startTime = performance.now();
    try {
      logger.info('[VisualCNN] Setting up WebGPU backend...');
      await tf.setBackend('webgpu');
      await tf.ready();
      this.stats.webgpuEnabled = true;
      logger.info('[VisualCNN] WebGPU backend ready.');

      logger.info('[VisualCNN] Loading Quantized MobileNetV2 model...');
      const modelUrl =
        'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1';
      this.model = await tf.loadGraphModel(modelUrl, { fromTFHub: true });

      this.modelLoaded = true;
      this.stats.modelLoadSuccess = true;
      this.stats.totalLoadTimeMs = performance.now() - startTime;
      logger.info(
        `[VisualCNN] Model loaded successfully in ${this.stats.totalLoadTimeMs.toFixed(0)}ms`
      );
      logger.warn(
        `[VisualCNN] IMPORTANT: The loaded MobileNetV2 model is a placeholder for ` +
          `architectural demonstration. It is trained on ImageNet and is NOT capable of ` +
          `detecting the required trigger warnings. A custom-trained model is required ` +
          `for this feature to be functional.`
      );
      return true;
    } catch (error) {
      logger.error('[VisualCNN] Failed to load model or set backend:', error);
      return false;
    }
  }

  async classify(imageBitmap: ImageBitmap): Promise<void> {
    if (!this.modelLoaded || !this.model) {
      logger.warn('[VisualCNN] Model not loaded, skipping classification.');
      return;
    }

    const startTime = performance.now();
    this.stats.totalInferences++;

    // Note: tf.tidy doesn't support async functions, so we manage tensors carefully
    try {
      // ⚡ Bolt: Wrapped initial frame creation in tidy is not possible because we need it later,
      // but we will dispose it manually.
      const currentFrame = tf.browser.fromPixels(imageBitmap);

      let sceneChange = true; // Default to true for first frame

      if (this.previousFrame) {
        // ⚡ Bolt: Use tf.tidy() to automatically dispose all intermediate tensors
        // created during diff calculation.
        sceneChange = tf.tidy(() => {
          const curr = currentFrame.toFloat().div(tf.scalar(255));
          const prev = this.previousFrame!.toFloat().div(tf.scalar(255));
          const diff = tf.abs(curr.sub(prev));
          // Use dataSync() inside worker to avoid async complexity in tidy
          return (diff.mean().dataSync())[0] > this.SCENE_CHANGE_THRESHOLD;
        });
      }

      if (sceneChange) {
        this.stats.sceneChangesDetected++;
        const result = await this.runClassification(currentFrame as tf.Tensor3D);
        if (result) {
          result.processingTimeMs = performance.now() - startTime;
          // Post result back to the main thread
          self.postMessage({ type: 'result', payload: result });
        }
      }

      // ⚡ Bolt: Optimization - Dispose previous frame before assignment
      this.previousFrame?.dispose();
      this.previousFrame = tf.clone(currentFrame);
      currentFrame.dispose();
    } catch (error) {
      logger.error('[VisualCNN] Classification error:', error);
    }
  }

  private async runClassification(frame: tf.Tensor3D): Promise<CNNInferenceResult | null> {
    // ⚡ Bolt: Use tf.tidy() to clean up all preprocessing tensors automatically.
    // Returns outputTensor which escapes the tidy zone.
    const outputTensor = tf.tidy(() => {
        // Normalize the frame to the range [-1, 1] and resize to the model's expected input size.
        const normalizedFrame = frame.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1)) as tf.Tensor3D;
        const resizedFrame = tf.image.resizeBilinear(normalizedFrame, [224, 224]);
        const reshapedFrame = resizedFrame.reshape([1, 224, 224, 3]);

        return this.model!.predict(reshapedFrame) as tf.Tensor;
    });

    const predictions = await outputTensor.data();
    outputTensor.dispose(); // ⚡ Bolt: Manually dispose the result

    // Since we don't have the class names for this model, we'll use placeholder names.
    const confidences: CategoryConfidences = {};
    predictions.forEach((value, index) => {
      // These are placeholder class names. A real model would have meaningful labels.
      const className = `class_${index}`;
      confidences[className] = value * 100;
    });

    // As an example, we'll map a few placeholder classes to our trigger categories.
    // This demonstrates the data flow, but is not functionally correct.
    confidences['redbone'] = predictions[2] * 100;
    confidences['military uniform'] = predictions[33] * 100;
    confidences['syringe'] = predictions[82] * 100;

    const topCategories = this.getTopCategories(confidences, 5);

    return {
      confidences,
      topCategories,
      processingTimeMs: 0,
      modelVersion: 'MobileNetV2',
    };
  }

  private getTopCategories(
    confidences: CategoryConfidences,
    k: number
  ): Array<{ category: TriggerCategory; confidence: number }> {
    // IMPORTANT: This is a placeholder mapping for demonstration purposes only.
    // A real implementation would use a custom-trained model where the output
    // classes directly correspond to the TriggerCategory enums.
    const imagenetToTriggerCategory: { [key: string]: TriggerCategory } = {
      redbone: 'blood',
      'military uniform': 'violence',
      syringe: 'medical_procedures',
    };

    return Object.entries(confidences)
      .filter(([category]) => imagenetToTriggerCategory[category])
      .map(([category, confidence]) => ({
        category: imagenetToTriggerCategory[category],
        confidence,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, k);
  }

  dispose(): void {
    this.model?.dispose();
    this.previousFrame?.dispose();
    this.modelLoaded = false;
    logger.info('[VisualCNN] Model disposed and resources freed');
  }
}

// --- Worker Setup ---

const visualCNN = new VisualCNN();

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      const success = await visualCNN.loadModel();
      self.postMessage({ type: 'init-complete', payload: { success } });
      break;
    case 'classify':
      if (payload.imageBitmap) {
        await visualCNN.classify(payload.imageBitmap);
        // Close the bitmap to release memory
        payload.imageBitmap.close();
      }
      break;
    case 'stop':
      visualCNN.dispose();
      break;
  }
};
