export const speakText = (text, voices = []) => {
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);

  // Prefer Indian English voices for better clarity
  const indianVoice = voices.find((voice) => voice.lang === "en-IN");
  
  if (indianVoice) {
    utterance.voice = indianVoice;
  } else if (voices.length > 0) {
    utterance.voice = voices[0]; // Use the first available voice as fallback
  }

  utterance.lang = "en-IN"; 
  utterance.rate = 0.8;  // Slower for better understanding
  utterance.pitch = 1.0; 

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  window.speechSynthesis.cancel();
};