/**
 * Integrates with ElevenLabs API to support instant voice cloning.
 * Requires ELEVENLABS_API_KEY environment variable.
 */

const getApiKey = () => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY is not defined in the environment.");
  }
  return key;
};

/**
 * Uploads a reference audio file to create an instant cloned voice.
 * @param file The audio file (mp3, wav)
 * @param name A name for the cloned voice
 * @returns The generated Voice ID
 */
export const cloneVoice = async (file: File, name: string): Promise<string> => {
  const apiKey = getApiKey();
  const formData = new FormData();
  formData.append('name', name);
  formData.append('files', file);

  const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || 'Failed to clone voice with ElevenLabs.');
  }

  const data = await response.json();
  return data.voice_id;
};

/**
 * Generates speech using a specific cloned Voice ID.
 * @param voiceId The ID of the cloned voice
 * @param text The text to synthesize
 * @returns Blob of the generated MP3 audio
 */
export const generateClonedSpeech = async (voiceId: string, text: string): Promise<Blob> => {
  const apiKey = getApiKey();
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2', // Good model for multiple languages including Indonesian
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || 'Failed to generate speech with ElevenLabs.');
  }

  return await response.blob();
};
