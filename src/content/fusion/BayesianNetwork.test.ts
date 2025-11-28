import { describe, it, expect } from 'vitest';
import { BayesianNetwork, type Evidence } from './BayesianNetwork';

describe('BayesianNetwork', () => {
  it('should calculate the posterior probability correctly with multiple pieces of evidence', () => {
    const bn = new BayesianNetwork('gore');
    const evidence: Evidence = {
      Audio: { state: 'True', confidence: 0.9 },
      Visual: { state: 'True', confidence: 0.95 },
      Text: { state: 'True', confidence: 0.8 },
    };
    const posterior = bn.calculatePosterior(evidence, 'gore');
    // Expected value may need adjustment based on the exact network parameters
    expect(posterior).toBeGreaterThan(0.9);
  });

  it('should return a low probability when evidence contradicts the trigger', () => {
    const bn = new BayesianNetwork('gore');
    const evidence: Evidence = {
      Audio: { state: 'False', confidence: 0.9 },
      Visual: { state: 'False', confidence: 0.95 },
    };
    const posterior = bn.calculatePosterior(evidence, 'gore');
    expect(posterior).toBeLessThan(0.1);
  });

  it('should apply the "Veto" mechanism for "Gore" when "Cartoon" is detected', () => {
    const bn = new BayesianNetwork('gore');
    const evidence: Evidence = {
      Audio: { state: 'True', confidence: 0.9 },
      Visual: { state: 'Cartoon', confidence: 1.0 }, // Strong evidence for "Cartoon"
      Text: { state: 'True', confidence: 0.8 },
    };
    const posterior = bn.calculatePosterior(evidence, 'gore');
    // The veto should significantly lower the probability, but other evidence can still have an impact.
    // We expect the result to be low, but not a hardcoded 0.01.
    expect(posterior).toBeLessThan(0.2);
  });

  it('should handle evidence with varying confidence levels', () => {
    const bn = new BayesianNetwork('gore');
    const evidence: Evidence = {
      Audio: { state: 'True', confidence: 0.5 },
      Visual: { state: 'True', confidence: 0.6 },
    };
    const posterior = bn.calculatePosterior(evidence, 'gore');
    expect(posterior).toBeGreaterThan(0.1);
    expect(posterior).toBeLessThan(0.9);
  });
});
