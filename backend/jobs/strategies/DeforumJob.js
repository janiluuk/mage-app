const VideoJobStrategy = require('./VideoJobStrategy');

class DeforumJob extends VideoJobStrategy {
  constructor() {
    super('deforum');
  }

  async run(jobPayload) {
    const { 
      frames, 
      settings, 
      audioFile, 
      motionStyle, 
      preset, 
      bpm 
    } = jobPayload || {};

    // Prepare motion settings based on style
    let motionSettings = settings || {};
    
    if (motionStyle === 'classic' && preset) {
      // Use preset settings for classic motion
      motionSettings = {
        ...motionSettings,
        ...preset.settings
      };
    } else if (motionStyle === 'bpm' && bpm) {
      // Calculate frame timing based on BPM
      const beatsPerSecond = bpm / 60;
      const framesPerBeat = Math.round(30 / beatsPerSecond); // Assuming 30 fps
      motionSettings = {
        ...motionSettings,
        bpm: bpm,
        framesPerBeat: framesPerBeat,
        motion_type: 'bpm_sync'
      };
    } else if (motionStyle === 'audio_sync') {
      // Flag for audio reactive motion
      motionSettings = {
        ...motionSettings,
        motion_type: 'audio_sync',
        audio_reactive: true
      };
    }

    return {
      strategy: this.name,
      status: 'queued',
      steps: [
        'serialize deforum timeline',
        audioFile ? 'process audio file' : null,
        'dispatch deforum workflow',
        'track animation progress',
      ].filter(Boolean),
      frames,
      settings: motionSettings,
      audioFile: audioFile || null,
      motionStyle: motionStyle || 'classic',
      preset: preset || null,
      bpm: bpm || null,
    };
  }
}

module.exports = DeforumJob;
