export const speakText = (text) => {
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const availableVoices = window.speechSynthesis.getVoices();

  // Find Google UK Female voice
  const googleUKFemale = availableVoices.find(
    (voice) => voice.name.includes("Google UK English Female")
  );

  if (googleUKFemale) {
    utterance.voice = googleUKFemale;
  } else if (availableVoices.length > 0) {
    utterance.voice = availableVoices[0]; // Fallback voice
  }

  // Set voice properties
  utterance.lang = "en-IN";  // British English
  utterance.rate = 0.9;  // Normal speed
  utterance.pitch = 1.0;  
  utterance.volume = 1.0;  

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  window.speechSynthesis.cancel();
};
