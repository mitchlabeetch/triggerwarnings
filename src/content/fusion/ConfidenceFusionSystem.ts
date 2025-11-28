/**
 * CONFIDENCE FUSION SYSTEM (Bayesian Network Implementation)
 *
 * This system integrates a Bayesian Network to fuse detection signals from multiple modalities.
 * It maintains the original API of the ConfidenceFusionSystem for seamless integration
 * with the existing application infrastructure, while delegating the core fusion logic
 * to the `BayesianNetwork` class. This approach provides a more robust and maintainable
 * method for calculating the confidence of trigger events.
 */

import type { Warning, TriggerCategory } from '@shared/types/Warning.types';
import { Logger } from '@shared/utils/logger';
import { BayesianNetwork, type Evidence } from './BayesianNetwork';

const logger = new Logger('ConfidenceFusionSystem');

interface Detection {
  source: 'subtitle' | 'audio-waveform' | 'audio-frequency' | 'visual' | 'photosensitivity' | 'temporal-pattern' | 'database';
  category: TriggerCategory;
  timestamp: number;
  confidence: number;
  warning: Warning;
  // Optional field for special visual states like 'Cartoon'
  visualState?: string;
}

export class ConfidenceFusionSystem {
  private recentDetections: Detection[] = [];
  private fusedWarnings: Map<string, Warning> = new Map();
  private bayesianNetworks: Map<TriggerCategory, BayesianNetwork> = new Map();
  private readonly DETECTION_WINDOW = 10; // 10 seconds
  private readonly MIN_CONFIDENCE_THRESHOLD = 50; // Don't process detections below 50%
  private readonly OUTPUT_THRESHOLD = 70; // Only output warnings >= 70% fused confidence

  private stats = {
    totalDetections: 0,
    fusedWarnings: 0,
    falsePositivesFiltered: 0,
    confidenceBoosted: 0,
    correlationDetected: 0,
  };

  /**
   * Add a detection from any source
   */
  addDetection(detection: Detection): void {
    if (detection.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return;
    }

    this.stats.totalDetections++;
    this.recentDetections.push(detection);
    this.cleanOldDetections(detection.timestamp);
    this.attemptFusion(detection);
  }

  private cleanOldDetections(currentTime: number): void {
    this.recentDetections = this.recentDetections.filter(
      (d) => currentTime - d.timestamp <= this.DETECTION_WINDOW
    );
  }

  /**
   * Attempt to fuse new detection with recent ones using the Bayesian Network
   */
  private attemptFusion(newDetection: Detection): void {
    const relatedDetections = this.findRelatedDetections(newDetection);
    const allDetections = [newDetection, ...relatedDetections];

    // Get or create a Bayesian Network for this category
    let bn = this.bayesianNetworks.get(newDetection.category);
    if (!bn) {
      bn = new BayesianNetwork(newDetection.category);
      this.bayesianNetworks.set(newDetection.category, bn);
    }

    // Convert detections to evidence for the Bayesian Network
    const evidence = this.formatDetectionsAsEvidence(allDetections);

    // Calculate posterior probability
    const posteriorProbability = bn.calculatePosterior(evidence, newDetection.category);
    const fusedConfidence = Math.round(posteriorProbability * 100);

    if (fusedConfidence >= this.OUTPUT_THRESHOLD) {
      this.stats.fusedWarnings++;
      if (allDetections.length > 1) {
        this.stats.confidenceBoosted++;
        this.stats.correlationDetected++;
      }

      logger.info(
        `[TW ConfidenceFusion] 🧠 FUSION SUCCESS | ` +
        `Category: ${newDetection.category} | ` +
        `Sources: ${allDetections.length} | ` +
        `Fused: ${fusedConfidence}%`
      );

      this.outputFusedWarning(newDetection.category, newDetection.timestamp, allDetections, fusedConfidence);
    } else {
      this.stats.falsePositivesFiltered++;
      logger.debug(
        `[TW ConfidenceFusion] ❌ FUSION REJECTED | ` +
        `Category: ${newDetection.category} | ` +
        `Fused confidence ${fusedConfidence}% < threshold ${this.OUTPUT_THRESHOLD}%`
      );
    }
  }

  private findRelatedDetections(detection: Detection): Detection[] {
    return this.recentDetections.filter(
      (d) =>
        d !== detection &&
        d.category === detection.category &&
        Math.abs(d.timestamp - detection.timestamp) <= 5
    );
  }

  /**
   * Formats a list of detections into the Evidence object required by the Bayesian Network
   */
  private formatDetectionsAsEvidence(detections: Detection[]): Evidence {
    const evidence: Evidence = {};

    for (const detection of detections) {
      let modality: 'Audio' | 'Visual' | 'Text' | null = null;
      switch (detection.source) {
        case 'audio-waveform':
        case 'audio-frequency':
          modality = 'Audio';
          break;
        case 'visual':
        case 'photosensitivity':
          modality = 'Visual';
          break;
        case 'subtitle':
          modality = 'Text';
          break;
      }

      if (modality) {
        // If evidence for this modality already exists, update it only if confidence is higher
        if (!evidence[modality] || detection.confidence > evidence[modality].confidence) {
          evidence[modality] = {
            state: detection.visualState || 'True', // Use visualState if present, otherwise default to 'True'
            confidence: detection.confidence / 100,
          };
        }
      }
    }

    return evidence;
  }

  private outputFusedWarning(
    category: TriggerCategory,
    timestamp: number,
    detections: Detection[],
    fusedConfidence: number
  ): void {
    const key = `${category}-${Math.floor(timestamp)}`;
    if (this.fusedWarnings.has(key)) {
      return;
    }

    const sources = detections.map((d) => d.source).join(', ');
    const warning: Warning = {
      id: `fused-${key}`,
      videoId: 'confidence-fusion',
      categoryKey: category,
      startTime: Math.max(0, timestamp - 3),
      endTime: timestamp + 5,
      submittedBy: 'confidence-fusion-system',
      status: 'approved',
      score: 0,
      confidenceLevel: fusedConfidence,
      requiresModeration: false,
      description: `[BN] Multi-signal detection (${sources}) → Fused: ${fusedConfidence}%`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.fusedWarnings.set(key, warning);
    logger.info(
      `[TW ConfidenceFusion] ✅ FUSED WARNING OUTPUT | ` +
      `${category} at ${timestamp.toFixed(1)}s | ` +
      `Confidence: ${fusedConfidence}%`
    );
  }

  getFusedWarnings(): Warning[] {
    return Array.from(this.fusedWarnings.values());
  }

  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  clear(): void {
    this.recentDetections = [];
    this.fusedWarnings.clear();
    this.bayesianNetworks.clear();
  }

  onFusedWarning(callback: (warning: Warning) => void): void {
    // Implementation would depend on an event emitter architecture
  }
}
