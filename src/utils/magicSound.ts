// Magic Wand Sound Effect using Web Audio API
export const playMagicWandSound = () => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Reduced volume to 10%
    
    // Magic wand sound: series of ascending tones with sparkle effect
    const frequencies = [440, 554, 659, 880, 1109, 1318]; // A4, C#5, E5, A5, C#6, E6
    const duration = 0.15; // Duration of each tone
    
    frequencies.forEach((frequency, index) => {
      // Create oscillator for main tone
      const oscillator = audioContext.createOscillator();
      oscillator.connect(gainNode);
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Add some harmonics for richness
      const harmonic = audioContext.createOscillator();
      harmonic.connect(gainNode);
      harmonic.frequency.setValueAtTime(frequency * 2, audioContext.currentTime);
      harmonic.type = 'triangle';
      
      // Create envelope for each tone
      const envelope = audioContext.createGain();
      envelope.connect(gainNode);
      oscillator.connect(envelope);
      harmonic.connect(envelope);
      
      const startTime = audioContext.currentTime + (index * duration * 0.6);
      const endTime = startTime + duration;
      
      // Fade in and out
      envelope.gain.setValueAtTime(0, startTime);
      envelope.gain.linearRampToValueAtTime(0.4, startTime + duration * 0.1); // Reduced from 0.8
      envelope.gain.exponentialRampToValueAtTime(0.01, endTime);
      
      // Start and stop oscillators
      oscillator.start(startTime);
      oscillator.stop(endTime);
      harmonic.start(startTime);
      harmonic.stop(endTime);
    });
    
    // Add sparkle effect (high frequency noise burst)
    setTimeout(() => {
      const sparkleOsc = audioContext.createOscillator();
      const sparkleGain = audioContext.createGain();
      
      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(gainNode);
      
      sparkleOsc.frequency.setValueAtTime(3000, audioContext.currentTime);
      sparkleOsc.type = 'sawtooth';
      
      sparkleGain.gain.setValueAtTime(0, audioContext.currentTime);
      sparkleGain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.05); // Reduced from 0.2
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      sparkleOsc.start(audioContext.currentTime);
      sparkleOsc.stop(audioContext.currentTime + 0.3);
    }, 200);
    
    // Add second sparkle burst for extra magic
    setTimeout(() => {
      const sparkle2 = audioContext.createOscillator();
      const sparkleGain2 = audioContext.createGain();
      
      sparkle2.connect(sparkleGain2);
      sparkleGain2.connect(gainNode);
      
      sparkle2.frequency.setValueAtTime(4000, audioContext.currentTime);
      sparkle2.type = 'triangle';
      
      sparkleGain2.gain.setValueAtTime(0, audioContext.currentTime);
      sparkleGain2.gain.linearRampToValueAtTime(0.06, audioContext.currentTime + 0.03); // Reduced from 0.15
      sparkleGain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      
      sparkle2.start(audioContext.currentTime);
      sparkle2.stop(audioContext.currentTime + 0.25);
    }, 400);
    
    console.log('🪄✨ Magic wand sound with sparkles played! ✨🪄');
    
  } catch (error) {
    console.log('Audio not supported or failed:', error);
    // Fallback: just log a magic message
    console.log('✨ *magical export sound* ✨');
  }
};

// Alternative simple chime sound
export const playSuccessChime = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    
    // Simple success chime: C-E-G chord
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      
      oscillator.connect(envelope);
      envelope.connect(gainNode);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + (index * 0.1);
      const duration = 0.8;
      
      envelope.gain.setValueAtTime(0, startTime);
      envelope.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
      envelope.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};