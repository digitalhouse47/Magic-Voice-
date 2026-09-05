import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VoiceName, SpeakingTone, ImageContentMode } from "../types";
import { TONE_DATA } from "../utils/constants";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to map virtual voices to real API models
const resolveVoice = (voice: VoiceName): string => {
  // Lilo is a virtual voice for "Child". We map it to Fenrir (High Pitch)
  if (voice === VoiceName.Lilo) {
    return VoiceName.Fenrir;
  }
  // Zephyr is mapped to Aoede
  if (voice === VoiceName.Zephyr) {
    return VoiceName.Aoede;
  }
  return voice;
};

/**
 * Generates speech from text using the gemini-2.5-flash-preview-tts model.
 * Returns the raw base64 encoded PCM audio data.
 */
export const generateSpeech = async (text: string, voice: VoiceName, tone: SpeakingTone = SpeakingTone.Normal): Promise<string> => {
  try {
    const apiVoiceName = resolveVoice(voice);

    // Apply Tone Instruction
    // The Gemini TTS model follows instructions embedded in the text.
    // e.g., "Say cheerfully: Hello world"
    let textToProcess = text;
    const toneInstruction = TONE_DATA[tone]?.instruction;

    if (toneInstruction && toneInstruction.trim() !== "") {
      textToProcess = `${toneInstruction}: ${text}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: textToProcess }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: apiVoiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned from the model.");
    }

    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

/**
 * Transcribes audio using the gemini-3-flash-preview model.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Transcribe the audio exactly as spoken.",
          },
        ],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No transcription text returned.");
    }
    return text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
};

/**
 * Generates a description, story, or sales copy from an image.
 */
export const generateTextFromImage = async (
  base64Image: string, 
  mimeType: string, 
  tone: SpeakingTone,
  mode: ImageContentMode
): Promise<string> => {
  try {
    let prompt = "";
    const langInstruction = "Answer strictly in Bahasa Indonesia (Indonesian Language).";

    // Specific instructions for specialized tones
    let styleInstruction = `The tone should be ${tone}.`;
    
    if (tone === SpeakingTone.Child) {
        styleInstruction = "Use simple vocabulary, short sentences, and a playful, enthusiastic voice suitable for a 5-year-old child.";
    } else if (tone === SpeakingTone.Advertisement) {
        styleInstruction = "Use punchy, persuasive, high-energy language typical of a TV or Radio commercial advertisement.";
    }

    switch (mode) {
      case ImageContentMode.Story:
        prompt = `Look at this image and create a lively, engaging short story based on what you see. Make the characters or scene come alive. ${styleInstruction} Keep it under 100 words. ${langInstruction}`;
        break;
      case ImageContentMode.HardSell:
        prompt = `Act as a professional copywriter. Write a "Hard Selling" script based on this image to sell the product or service shown. Use persuasive, urgent, and direct language with a Call to Action. ${styleInstruction} Keep it under 100 words. ${langInstruction}`;
        break;
      case ImageContentMode.SoftSell:
        prompt = `Act as a professional content creator. Write a "Soft Selling" script based on this image. Focus on storytelling, emotions, and lifestyle benefits rather than direct sales features. Connect with the audience. ${styleInstruction} Keep it under 100 words. ${langInstruction}`;
        break;
      case ImageContentMode.Description:
      default:
        prompt = `Describe exactly what is in this image. Be detailed but concise. ${styleInstruction} Keep it under 60 words. ${langInstruction}`;
        break;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });
    return response.text || "Could not generate text from image.";
  } catch (error) {
    console.error("Error generating text from image:", error);
    throw error;
  }
}

/**
 * Generates audio directly from a provided script using Multi-Speaker TTS.
 * Useful for manual script building.
 */
export const generateDialogueAudio = async (
  script: string,
  speaker1: VoiceName,
  speaker2: VoiceName
): Promise<string> => {
  try {
    const apiSpeaker1 = resolveVoice(speaker1);
    const apiSpeaker2 = resolveVoice(speaker2);

    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: speaker1, // The API requires the speaker name in the script to match this
                voiceConfig: { prebuiltVoiceConfig: { voiceName: apiSpeaker1 } }
              },
              {
                speaker: speaker2, // The API requires the speaker name in the script to match this
                voiceConfig: { prebuiltVoiceConfig: { voiceName: apiSpeaker2 } }
              }
            ]
          }
        }
      }
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) throw new Error("Failed to generate dialogue audio.");

    return base64Audio;
  } catch (error) {
    console.error("Error generating dialogue audio:", error);
    throw error;
  }
};