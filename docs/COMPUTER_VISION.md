# Computer Vision & AI Detection

Documentation for the experimental local AI detection system in Trigger Warnings.

---

## ⚠️ Experimental Feature

**Status**: 🧪 **Experimental** (disabled by default)

The AI detection system is still in development. It may:
- Miss triggers (false negatives)
- Report false positives
- Impact browser performance
- Require significant RAM (100-200MB extra)

**Use at your own discretion.**

---

## 📋 Overview

The Trigger Warnings extension includes **optional local AI models** that can automatically detect triggers in video content without relying on community submissions. This is especially useful for:
- New or obscure content without warnings yet
- Real-time detection during live streams
- Enhanced coverage alongside community warnings

### Key Principles

1. **Privacy-first**: All processing happens in your browser (no video data sent externally)
2. **Multi-modal**: Combines audio, visual, and subtitle analysis
3. **Efficient**: Cascade architecture (fast filters → deep analysis only when needed)
4. **Transparent**: Open-source models with clear limitations

---

## 🏗️ Architecture

### Cascade Detection Pipeline

```
Video Frame (60 FPS)
    ↓
┌───────────────────────────────────┐
│  Frame Sampler (2 FPS)            │  ← Reduce load
└───────────────┬───────────────────┘
                ↓
┌───────────────────────────────────┐
│  CLIP Filter (Fast)               │  ← 50ms per frame
│  Zero-shot image classification   │
│  Threshold: 0.25                  │
└───────────────┬───────────────────┘
                ↓ (Only if > 0.25)
┌───────────────────────────────────┐
│  YOLO Detector (Medium)           │  ← 100ms per frame
│  Object detection (spiders, etc.) │
│  Threshold: 0.5                   │
└───────────────┬───────────────────┘
                ↓ (Only if > 0.5)
┌───────────────────────────────────┐
│  VLM Confirmation (Slow)          │  ← 500ms per frame
│  Vision-language model            │
│  Threshold: 0.6                   │
└───────────────┬───────────────────┘
                ↓
         ┌──────────┐
         │ TRIGGER! │
         └──────────┘
```

**Why cascade?**
- Most frames (99%+) are benign → CLIP filter rejects them quickly
- Only suspicious frames go to deeper analysis
- Saves CPU/GPU time and battery

### Audio Analysis (Parallel)

```
Audio Stream
    ↓
┌───────────────────────────────────┐
│  Audio Sampler (2-second chunks)  │
└───────────────┬───────────────────┘
                ↓
┌───────────────────────────────────┐
│  CLAP (Audio CLIP)                │  ← 200ms per chunk
│  Zero-shot audio classification   │
│  Detects: screams, retching, etc. │
└───────────────┬───────────────────┘
                ↓ (If match)
┌───────────────────────────────────┐
│  Spectrogram Analysis             │  ← 100ms
│  Frequency pattern matching       │
└───────────────┬───────────────────┘
                ↓
         ┌──────────┐
         │ TRIGGER! │
         └──────────┘
```

### Subtitle Analysis (Parallel)

```
Subtitle Track
    ↓
┌───────────────────────────────────┐
│  Text Extraction                  │
│  From WebVTT, SRT, or DOM         │
└───────────────┬───────────────────┘
                ↓
┌───────────────────────────────────┐
│  Keyword Matching                 │  ← 1ms per subtitle
│  Regex for trigger words          │
└───────────────┬───────────────────┘
                ↓ (If keywords found)
┌───────────────────────────────────┐
│  Context Analysis (NLP)           │  ← 50ms per subtitle
│  BERT model for false positives   │
│  (e.g., "violence in the news")   │
└───────────────┬───────────────────┘
                ↓
         ┌──────────┐
         │ TRIGGER! │
         └──────────┘
```

---

## 🧠 AI Models

### Visual Analysis

#### CLIP (OpenAI)
- **Purpose**: Fast zero-shot image classification
- **Size**: ~150MB (loaded on demand)
- **Speed**: ~50ms per frame (GPU), ~200ms (CPU)
- **Accuracy**: 70-80% recall, 60-70% precision

**Prompts:**
```typescript
const prompts = {
  violence: "a violent scene with fighting or physical harm",
  gore: "graphic blood, injury, or gore",
  spiders: "a spider or arachnid",
  medical: "a medical procedure, surgery, or needles",
  // ... more categories
};
```

**Usage:**
```typescript
import { Transformers } from '@xenova/transformers';

const clip = await Transformers.CLIPModel.from_pretrained('openai/clip-vit-base-patch32');

const scores = await clip.classify(imageData, {
  candidate_labels: Object.values(prompts),
});

if (scores.violence > 0.25) {
  // Potential violence detected, pass to YOLO
}
```

#### YOLO (You Only Look Once)
- **Purpose**: Object detection (weapons, spiders, etc.)
- **Size**: ~40MB
- **Speed**: ~100ms per frame (GPU), ~500ms (CPU)
- **Accuracy**: 85-90% for trained objects

**Detectable Objects:**
- Spiders (from COCO dataset)
- Weapons (guns, knives)
- Medical equipment (syringes, scalpels)
- Blood (custom-trained)

**Usage:**
```typescript
import * as tf from '@tensorflow/tfjs';

const yolo = await tf.loadGraphModel('/models/yolo-v5.json');

const detections = await yolo.detect(imageData);

for (const detection of detections) {
  if (detection.class === 'spider' && detection.score > 0.5) {
    // Spider detected!
  }
}
```

#### VLM (Vision-Language Model)
- **Purpose**: Context-aware confirmation (reduce false positives)
- **Model**: LLaVA or MiniGPT-4 (via Transformers.js)
- **Size**: ~200MB
- **Speed**: ~500ms per frame (GPU), ~2s (CPU)
- **Accuracy**: 90-95% precision

**Example:**
```typescript
const vlm = await Transformers.VisionEncoderDecoderModel.from_pretrained('llava-hf/llava-1.5-7b');

const prompt = "Is there violence or physical harm in this image? Answer yes or no.";
const response = await vlm.generate(imageData, prompt);

if (response.toLowerCase().includes('yes')) {
  // Confirmed trigger
}
```

### Audio Analysis

#### CLAP (Contrastive Language-Audio Pretraining)
- **Purpose**: Detect auditory triggers (screams, retching, gunshots)
- **Size**: ~100MB
- **Speed**: ~200ms per 2-second chunk
- **Accuracy**: 75-85%

**Prompts:**
```typescript
const audioPrompts = {
  emetophobia: "the sound of someone vomiting or retching",
  gunshots: "loud gunshots or explosions",
  screaming: "someone screaming or crying out in pain",
};
```

**Usage:**
```typescript
const clap = await Transformers.CLAPModel.from_pretrained('laion/clap-htsat-unfused');

const scores = await clap.classify(audioBuffer, {
  candidate_labels: Object.values(audioPrompts),
});

if (scores.emetophobia > 0.3) {
  // Potential emetophobia trigger
}
```

### Subtitle Analysis

#### BERT (NLP)
- **Purpose**: Context-aware keyword detection
- **Model**: DistilBERT (optimized for speed)
- **Size**: ~50MB
- **Speed**: ~50ms per subtitle
- **Accuracy**: 80-90%

**Example:**
```typescript
const bert = await Transformers.AutoModelForSequenceClassification.from_pretrained(
  'distilbert-base-uncased-finetuned-sst-2-english'
);

const subtitleText = "There was violence in the news today"; // Not a trigger
const score = await bert.classify(subtitleText, ['trigger_violence', 'not_trigger']);

if (score.trigger_violence > 0.7) {
  // Likely a depiction, not just discussion
}
```

---

## ⚙️ Configuration

### Enabling AI Detection

**In Options page:**
1. Settings → "Experimental Features"
2. Toggle "Local AI Detection"
3. Choose models to enable:
   - ☑️ Visual (CLIP + YOLO + VLM)
   - ☑️ Audio (CLAP)
   - ☑️ Subtitles (BERT)

**Programmatically:**
```typescript
import { DetectionSettings } from '@core/storage';

await DetectionSettings.set({
  enabled: true,
  visual: { enabled: true, cascade: true },
  audio: { enabled: true },
  subtitles: { enabled: true },
});
```

### Performance Settings

**GPU Acceleration:**
```typescript
import '@tensorflow/tfjs-backend-webgpu';

await tf.setBackend('webgpu'); // Fastest (if supported)
// or
await tf.setBackend('webgl'); // Fast (widely supported)
// or
await tf.setBackend('cpu'); // Slow but universal
```

**Memory Management:**
```typescript
// Limit memory usage
tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);

// Clean up models when done
model.dispose();
```

**Sampling Rate:**
```typescript
// Analyze fewer frames (less accurate, faster)
const settings = {
  visual: { fps: 1 }, // Default: 2 FPS
  audio: { chunkSize: 4 }, // Default: 2 seconds
};
```

---

## 📊 Accuracy & Limitations

### Strengths

✅ **High recall for obvious triggers**: Detects 80-90% of clear violence, gore, spiders  
✅ **Fast on GPU**: Real-time on modern hardware (RTX 3060+)  
✅ **Privacy-preserving**: No data leaves your device  
✅ **Complements community warnings**: Catches content without submissions  

### Limitations

❌ **Context-dependent**: May flag action movie previews, medical dramas  
❌ **False negatives**: Misses ~10-20% of triggers (especially implied violence)  
❌ **False positives**: ~5-15% of alerts are incorrect  
❌ **Resource-intensive**: 100-200MB RAM, 5-10% CPU on GPU  
❌ **Not real-time on CPU**: 2-5 second delay on slower hardware  

### Known Issues

| Issue | Workaround |
|-------|------------|
| High CPU usage | Enable GPU acceleration (WebGPU) |
| False positives on cartoons | Increase VLM threshold (0.6 → 0.8) |
| Misses subtle triggers | Use community warnings as primary |
| Lag on older hardware | Disable AI detection, use community only |

---

## 🧪 Testing & Validation

### Test Content

We validate models against a labeled test set:
- **100 clips** with known triggers (violence, gore, spiders, etc.)
- **100 clips** without triggers (control)

**Metrics:**
- **Recall**: % of triggers detected (aim: >80%)
- **Precision**: % of alerts that are correct (aim: >70%)
- **F1 Score**: Harmonic mean of precision & recall

### Running Tests

```bash
# Run AI detection tests
npm run test:ai

# Generate accuracy report
npm run test:ai:report
```

**Example output:**
```
Visual Detection (CLIP + YOLO + VLM):
  Violence: Recall 85%, Precision 72%, F1 78%
  Gore: Recall 78%, Precision 68%, F1 73%
  Spiders: Recall 92%, Precision 88%, F1 90%

Audio Detection (CLAP):
  Emetophobia: Recall 80%, Precision 65%, F1 72%
  Gunshots: Recall 88%, Precision 82%, F1 85%

Overall: Recall 83%, Precision 73%, F1 77%
```

---

## 🛠️ Development

### Adding a New Trigger Type

1. **Add to prompts** (`src/_Detection_System/config.ts`):
   ```typescript
   export const VISUAL_PROMPTS = {
     // ... existing
     my_new_trigger: "description of visual trigger",
   };
   
   export const AUDIO_PROMPTS = {
     // ... existing
     my_new_trigger: "description of auditory trigger",
   };
   ```

2. **Update type definitions** (`src/shared/types/Detection.types.ts`):
   ```typescript
   export type DetectionTriggerType = 
     | 'violence'
     | 'gore'
     | 'my_new_trigger'; // Add here
   ```

3. **Test on labeled data**:
   - Collect 50 clips with the trigger
   - Collect 50 clips without it
   - Run `npm run test:ai:single my_new_trigger`
   - Aim for F1 > 70%

4. **Submit PR** with test results

### Training Custom Models

**For advanced users** who want to fine-tune models:

1. **Collect training data**: 1000+ labeled images/audio clips
2. **Fine-tune CLIP**:
   ```python
   from transformers import CLIPProcessor, CLIPModel, Trainer

   model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32')
   # ... fine-tuning code ...
   ```

3. **Convert to TFJS**:
   ```bash
   tensorflowjs_converter --input_format=tf_saved_model \
     --output_format=tfjs_graph_model \
     /path/to/saved_model \
     /path/to/output
   ```

4. **Test in extension**:
   ```typescript
   const customModel = await tf.loadGraphModel('/custom-models/my-model.json');
   ```

---

## 🔮 Future Improvements

- **More models**: Emotion recognition, object segmentation
- **Federated learning**: Improve models based on user feedback (privacy-preserving)
- **Lighter models**: <50MB for mobile browsers (TinyML)
- **Real-time on CPU**: Optimize for faster inference
- **Custom training**: Let users train on their own labeled data

---

## 📚 References

- **CLIP Paper**: https://arxiv.org/abs/2103.00020
- **YOLO Paper**: https://arxiv.org/abs/1506.02640
- **CLAP Paper**: https://arxiv.org/abs/2211.06687
- **Transformers.js**: https://huggingface.co/docs/transformers.js
- **TensorFlow.js**: https://www.tensorflow.org/js

---

<div align="center">

**Questions?** [Open a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) 💬

[Back to README](../README.md)

</div>
