export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  TTS = 'TTS',
  STT = 'STT',
  DIALOGUE = 'DIALOGUE',
  IMAGE_TO_VOICE = 'IMAGE_TO_VOICE',
  VOICE_CLONING = 'VOICE_CLONING'
}

export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Aoede = 'Aoede',
  Zephyr = 'Zephyr',
  Lilo = 'Lilo' // Virtual Child Voice
}

export enum SpeakingTone {
  Normal = 'Normal',
  Child = 'Child (Suara Anak-anak)',
  Advertisement = 'Advertisement (Gaya Iklan)',
  Happy = 'Happy (Senang/Ceria)',
  Sad = 'Sad (Sedih)',
  Professional = 'Professional (Profesional)',
  Excited = 'Excited (Bersemangat)',
  Whispering = 'Whispering (Berbisik)',
  Sarcastic = 'Sarcastic (Sarkas)',
  Angry = 'Angry (Marah)',
  Fearful = 'Fearful (Takut)',
  Sleepy = 'Sleepy (Mengantuk)',
  Dramatic = 'Dramatic (Dramatis)',
  Romantic = 'Romantic (Romantis)',
  Robot = 'Robot (Datar/Robotik)',
  NewsAnchor = 'News Anchor (Berita)',
  Storyteller = 'Storyteller (Mendongeng)'
}

export enum ImageContentMode {
  Description = 'Description (Deskripsi Visual)',
  Story = 'Creative Story (Cerita Pendek)',
  HardSell = 'Hard Selling (Promosi Langsung)',
  SoftSell = 'Soft Selling (Promosi Halus/Edukatif)'
}

export interface AudioConfig {
  voiceName: VoiceName;
}

export interface TranscribeResult {
  text: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  province: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
}

// Helper type for the PCM decoder
export interface PcmAudioBuffer {
  data: Float32Array;
  sampleRate: number;
}