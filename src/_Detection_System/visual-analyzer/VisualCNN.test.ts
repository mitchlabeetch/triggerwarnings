
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { VisualCNN } from './VisualCNN';

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', async () => {
    return {
        ready: vi.fn().mockResolvedValue(undefined),
        setBackend: vi.fn().mockResolvedValue(undefined),
        loadGraphModel: vi.fn(),
        getBackend: vi.fn().mockReturnValue('test-backend'),
        browser: {
            fromPixels: vi.fn(),
        },
        image: {
            resizeBilinear: vi.fn(),
        },
        tidy: vi.fn((fn) => fn()),
        zeros: vi.fn(() => ({ dispose: vi.fn() })),
    };
});

// Mock Backend WebGPU import (it's a side-effect import)
vi.mock('@tensorflow/tfjs-backend-webgpu', () => ({}));

describe('VisualCNN', () => {
  let visualCNN: VisualCNN;
  let mockModel: any;
  let mockTensor: any;

  beforeAll(() => {
    // Mock global ImageData if needed
    if (typeof ImageData === 'undefined') {
        global.ImageData = class {
            width: number;
            height: number;
            data: Uint8ClampedArray;
            constructor(w: number, h: number) {
                this.width = w;
                this.height = h;
                this.data = new Uint8ClampedArray(w * h * 4);
            }
        } as any;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Mock Tensor
    mockTensor = {
        toFloat: vi.fn().mockReturnThis(),
        div: vi.fn().mockReturnThis(),
        sub: vi.fn().mockReturnThis(),
        expandDims: vi.fn().mockReturnThis(),
        dispose: vi.fn(),
        data: vi.fn().mockResolvedValue(new Float32Array(28).fill(0.5)), // 50% confidence
    };

    // Setup Mock Model
    mockModel = {
        predict: vi.fn().mockReturnValue(mockTensor),
        dispose: vi.fn(),
    };

    // Setup TF mocks
    (tf.loadGraphModel as any).mockResolvedValue(mockModel);
    (tf.browser.fromPixels as any).mockReturnValue(mockTensor);
    (tf.image.resizeBilinear as any).mockReturnValue(mockTensor);

    // Re-instantiate to get fresh state if needed, but VisualCNN is a class we export as singleton too.
    // We'll create a new instance for testing to avoid singleton state issues.
    visualCNN = new VisualCNN();
  });

  it('should be defined', () => {
    expect(visualCNN).toBeDefined();
  });

  it('should load model correctly', async () => {
    const success = await visualCNN.loadModel('fake-url');

    expect(tf.ready).toHaveBeenCalled();
    expect(tf.loadGraphModel).toHaveBeenCalledWith('fake-url');
    expect(success).toBe(true);
    expect(visualCNN.isLoaded()).toBe(true);
  });

  it('should fallback to default URL if none provided', async () => {
    await visualCNN.loadModel();
    expect(tf.loadGraphModel).toHaveBeenCalledWith(expect.stringContaining('https://cdn.triggerwarnings.ai/models/visual-v1.tfjs'));
  });

  it('should handle load failure', async () => {
    (tf.loadGraphModel as any).mockRejectedValue(new Error('Load failed'));

    const success = await visualCNN.loadModel();
    expect(success).toBe(false);
    expect(visualCNN.isLoaded()).toBe(false);
  });

  it('should classify image correctly', async () => {
    await visualCNN.loadModel();

    const imageData = new ImageData(100, 100);
    const result = await visualCNN.classify(imageData);

    expect(tf.browser.fromPixels).toHaveBeenCalledWith(imageData);
    expect(tf.image.resizeBilinear).toHaveBeenCalled();
    expect(mockModel.predict).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.confidences['blood']).toBeCloseTo(50); // 0.5 * 100
  });

  it('should throw if classifying before load', async () => {
    const imageData = new ImageData(100, 100);
    await expect(visualCNN.classify(imageData)).rejects.toThrow('Model not loaded');
  });

  it('should dispose model correctly', async () => {
    await visualCNN.loadModel();
    visualCNN.dispose();

    expect(mockModel.dispose).toHaveBeenCalled();
    expect(visualCNN.isLoaded()).toBe(false);
  });
});
