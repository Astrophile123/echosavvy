export const speakText = (text, voices = []) => {
    if (!text) return;
  
    const utterance = new SpeechSynthesisUtterance(text);
  
    
    const femaleVoice = voices.find((voice) => {
      return voice.name.toLowerCase().includes("female") && voice.lang.startsWith("en");
    });
  
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else if (voices.length > 0) {
      utterance.voice = voices[0]; 
    }
  
    utterance.lang = "en-IN"; 
    utterance.rate = 1; 
    utterance.pitch = 1.0; 
  
    window.speechSynthesis.speak(utterance);
  };
  
  export const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };