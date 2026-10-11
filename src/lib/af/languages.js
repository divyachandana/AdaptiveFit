// Voice languages for spoken coaching and speech recognition.
export const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "it-IT", label: "Italiano" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "nl-NL", label: "Nederlands" },
  { code: "ru-RU", label: "Русский" },
  { code: "zh-CN", label: "中文 (普通话)" },
  { code: "ja-JP", label: "日本語" },
  { code: "ko-KR", label: "한국어" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "ar-SA", label: "العربية" },
  { code: "tr-TR", label: "Türkçe" }
];

const KEY = "voice_language";
export const getLanguage = () => localStorage.getItem(KEY) || "en-US";
export function setLanguage(code) {
  localStorage.setItem(KEY, code);
  window.dispatchEvent(new Event("voice-language-changed"));
}