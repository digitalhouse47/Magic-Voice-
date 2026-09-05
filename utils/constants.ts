import { VoiceName, SpeakingTone } from "../types";
import { User, UserCheck, Sparkles, Zap, Feather, Baby } from "lucide-react";

export const VOICE_META = {
  [VoiceName.Puck]: {
    label: "Puck (Baru & Gratis)",
    gender: "Pria",
    style: "Dalam & Kuat",
    icon: User
  },
  [VoiceName.Charon]: {
    label: "Charon (Baru & Gratis)",
    gender: "Pria",
    style: "Serak & Serius",
    icon: UserCheck
  },
  [VoiceName.Kore]: {
    label: "Kore (Baru & Gratis)",
    gender: "Wanita",
    style: "Menenangkan & Kalem",
    icon: Sparkles
  },
  [VoiceName.Fenrir]: {
    label: "Fenrir (Baru & Gratis)",
    gender: "Pria",
    style: "Nada Tinggi & Energik",
    icon: Zap
  },
  [VoiceName.Aoede]: {
    label: "Aoede (Baru & Gratis)",
    gender: "Wanita",
    style: "Hangat & Ekspresif",
    icon: Feather
  },
  [VoiceName.Zephyr]: {
    label: "Zephyr (Baru & Gratis)",
    gender: "Wanita",
    style: "Lembut & Elegan",
    icon: Feather
  },
  [VoiceName.Lilo]: {
    label: "Lilo (Baru & Gratis)",
    gender: "Anak-anak",
    style: "Ceria, Polos & Imut",
    icon: Baby
  }
};

export const TONE_DATA: Record<SpeakingTone, { emoji: string; label: string; instruction: string }> = {
  [SpeakingTone.Normal]: { 
    emoji: "😐", 
    label: "Normal", 
    instruction: "" 
  },
  [SpeakingTone.Child]: { 
    emoji: "🎈", 
    label: "Anak-anak", 
    instruction: "Speak like a cute, high-pitched 5-year-old child" 
  },
  [SpeakingTone.Advertisement]: { 
    emoji: "📢", 
    label: "Iklan", 
    instruction: "Speak in a punchy, persuasive, and energetic TV commercial style" 
  },
  [SpeakingTone.Happy]: { 
    emoji: "😀", 
    label: "Ceria", 
    instruction: "Say cheerfully and happily" 
  },
  [SpeakingTone.Sad]: { 
    emoji: "😢", 
    label: "Sedih", 
    instruction: "Say with a sad and regretful tone" 
  },
  [SpeakingTone.Professional]: { 
    emoji: "👔", 
    label: "Profesional", 
    instruction: "Say in a professional, business-like confidence" 
  },
  [SpeakingTone.Excited]: { 
    emoji: "🤩", 
    label: "Semangat", 
    instruction: "Say with great excitement and high energy" 
  },
  [SpeakingTone.Whispering]: { 
    emoji: "🤫", 
    label: "Berbisik", 
    instruction: "Whisper quietly" 
  },
  [SpeakingTone.Sarcastic]: { 
    emoji: "😒", 
    label: "Sarkas", 
    instruction: "Say sarcastically" 
  },
  [SpeakingTone.Angry]: { 
    emoji: "😡", 
    label: "Marah", 
    instruction: "Say in an angry and aggressive tone" 
  },
  [SpeakingTone.Fearful]: { 
    emoji: "😱", 
    label: "Takut", 
    instruction: "Say with fear and trembling" 
  },
  [SpeakingTone.Sleepy]: { 
    emoji: "😴", 
    label: "Mengantuk", 
    instruction: "Say in a sleepy, yawning voice" 
  },
  [SpeakingTone.Dramatic]: { 
    emoji: "🎭", 
    label: "Dramatis", 
    instruction: "Say dramatically like a movie trailer" 
  },
  [SpeakingTone.Romantic]: { 
    emoji: "🌹", 
    label: "Romantis", 
    instruction: "Say in a soft, romantic, and seductive tone" 
  },
  [SpeakingTone.Robot]: { 
    emoji: "🤖", 
    label: "Robot", 
    instruction: "Speak in a flat, robotic monotone" 
  },
  [SpeakingTone.NewsAnchor]: { 
    emoji: "📰", 
    label: "Berita", 
    instruction: "Speak like a formal news anchor reporting breaking news" 
  },
  [SpeakingTone.Storyteller]: { 
    emoji: "📖", 
    label: "Dongeng", 
    instruction: "Speak like a captivating storyteller reading a book" 
  }
};

export const PROVINCES = [
  "Aceh", "Bali", "Banten", "Bengkulu", "DI Yogyakarta", "DKI Jakarta",
  "Gorontalo", "Jambi", "Jawa Barat", "Jawa Tengah", "Jawa Timur",
  "Kalimantan Barat", "Kalimantan Selatan", "Kalimantan Tengah", "Kalimantan Timur",
  "Kalimantan Utara", "Kepulauan Bangka Belitung", "Kepulauan Riau", "Lampung",
  "Maluku", "Maluku Utara", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Papua", "Papua Barat", "Riau", "Sulawesi Barat", "Sulawesi Selatan",
  "Sulawesi Tengah", "Sulawesi Tenggara", "Sulawesi Utara", "Sumatera Barat",
  "Sumatera Selatan", "Sumatera Utara"
];