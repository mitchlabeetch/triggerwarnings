/**
 * Bayesian Network for Cross-Modal Confidence Fusion
 *
 * Implements a Bayesian network to calculate the posterior probability of a trigger event,
 * given evidence from multiple modalities (Audio, Visual, Text).
 */

import type { TriggerCategory } from '@shared/types/Warning.types';

// Defining the structure of the Bayesian Network
interface Node {
  name: string;
  states: string[];
  parents: string[];
  cpt: Record<string, number[]>;
}

interface BayesianNetworkStructure {
  [nodeName: string]: Node;
}

// Evidence from modalities
export interface Evidence {
  [nodeName: string]: {
    state: string;
    confidence: number;
  };
}

export class BayesianNetwork {
  private network: BayesianNetworkStructure = {};

  constructor(category: TriggerCategory) {
    this.network = this.createNetworkForCategory(category);
  }

  /**
   * Creates a Bayesian Network for a specific trigger category
   */
  private createNetworkForCategory(category: TriggerCategory): BayesianNetworkStructure {
    // Veto mechanism for 'Gore' when 'Cartoon' is detected, modeled in the CPT
    if (category === 'gore') {
      return {
        'Visual_Is_Cartoon': {
            name: 'Visual_Is_Cartoon',
            states: ['True', 'False'],
            parents: [],
            cpt: { None: [0.1, 0.9] }, // Prior for cartoon visuals
        },
        [category]: {
          name: 'Gore',
          states: ['True', 'False'],
          parents: ['Visual_Is_Cartoon'],
          cpt: {
            'Visual_Is_Cartoon=True': [0.01, 0.99], // P(Gore|Visual_Is_Cartoon=T) - VETO
            'Visual_Is_Cartoon=False': [0.1, 0.9], // P(Gore|Visual_Is_Cartoon=F) - Prior
          },
        },
        Audio: {
          name: 'Audio',
          states: ['True', 'False'],
          parents: [category],
          cpt: {
            [`${category}=True`]: [0.8, 0.2],
            [`${category}=False`]: [0.1, 0.9],
          },
        },
        Visual: {
          name: 'Visual',
          states: ['True', 'False', 'Cartoon'],
          parents: [category],
          cpt: {
            [`${category}=True`]: [0.9, 0.1, 0.0],
            [`${category}=False`]: [0.05, 0.8, 0.15],
          },
        },
        Text: {
          name: 'Text',
          states: ['True', 'False'],
          parents: [category],
          cpt: {
            [`${category}=True`]: [0.7, 0.3],
            [`${category}=False`]: [0.2, 0.8],
          },
        },
      };
    }
    // Default network for other categories
    return {
        [category]: {
            name: category,
            states: ['True', 'False'],
            parents: [],
            cpt: { None: [0.1, 0.9] },
          },
          Audio: {
            name: 'Audio',
            states: ['True', 'False'],
            parents: [category],
            cpt: {
              [`${category}=True`]: [0.8, 0.2],
              [`${category}=False`]: [0.1, 0.9],
            },
          },
          Visual: {
            name: 'Visual',
            states: ['True', 'False'],
            parents: [category],
            cpt: {
                [`${category}=True`]: [0.9, 0.1],
                [`${category}=False`]: [0.05, 0.95],
            },
          },
          Text: {
            name: 'Text',
            states: ['True', 'False'],
            parents: [category],
            cpt: {
                [`${category}=True`]: [0.7, 0.3],
                [`${category}=False`]: [0.2, 0.8],
            },
          },
    };
  }

  /**
   * Calculates the posterior probability of a trigger event using log-odds
   * to ensure numerical stability.
   */
  calculatePosterior(evidence: Evidence, category: TriggerCategory): number {
    const triggerNode = this.network[category];
    if (!triggerNode) return 0;

    // Check for cartoon evidence and adjust prior accordingly
    let priorLogOdds;
    if (category === 'gore' && evidence['Visual']?.state === 'Cartoon') {
        const vetoCpt = triggerNode.cpt['Visual_Is_Cartoon=True'];
        priorLogOdds = Math.log(vetoCpt[0] / vetoCpt[1]);
    } else {
        const baseCpt = triggerNode.parents.length > 0 ? triggerNode.cpt['Visual_Is_Cartoon=False'] : triggerNode.cpt['None'];
        priorLogOdds = Math.log(baseCpt[0] / baseCpt[1]);
    }

    let posteriorLogOdds = priorLogOdds;

    for (const nodeName in evidence) {
      if (nodeName !== category && this.network[nodeName]) {
        const evidenceNode = this.network[nodeName];
        const { state, confidence } = evidence[nodeName];
        const stateIndex = evidenceNode.states.indexOf(state);

        if (stateIndex === -1) continue;

        const probEvidenceGivenTrue = evidenceNode.cpt[`${category}=True`][stateIndex];
        const probEvidenceGivenFalse = evidenceNode.cpt[`${category}=False`][stateIndex];

        if (probEvidenceGivenTrue > 0 && probEvidenceGivenFalse > 0) {
            const likelihoodRatio = probEvidenceGivenTrue / probEvidenceGivenFalse;
            const weightedLogLikelihoodRatio = Math.log(likelihoodRatio) * confidence;
            posteriorLogOdds += weightedLogLikelihoodRatio;
        }
      }
    }

    const posteriorOdds = Math.exp(posteriorLogOdds);
    const posteriorProbability = posteriorOdds / (1 + posteriorOdds);

    return posteriorProbability;
  }
}
