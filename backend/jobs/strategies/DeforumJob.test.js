const { test } = require('node:test');
const assert = require('node:assert/strict');
const DeforumJob = require('./DeforumJob');
const VideoJobStrategy = require('./VideoJobStrategy');

test('DeforumJob extends VideoJobStrategy', () => {
  const job = new DeforumJob();
  
  assert.ok(job instanceof VideoJobStrategy);
  assert.equal(job.name, 'deforum');
});

test('DeforumJob run returns queued job structure', async () => {
  const job = new DeforumJob();
  const payload = {
    frames: 120,
    settings: { angle: '0:(0)' }
  };
  
  const result = await job.run(payload);
  
  assert.equal(result.strategy, 'deforum');
  assert.equal(result.status, 'queued');
  assert.equal(result.frames, 120);
  assert.ok(result.settings);
  assert.ok(Array.isArray(result.steps));
});

test('DeforumJob run includes expected processing steps', async () => {
  const job = new DeforumJob();
  const result = await job.run({ frames: 60 });
  
  assert.ok(result.steps.includes('serialize deforum timeline'));
  assert.ok(result.steps.includes('dispatch deforum workflow'));
  assert.ok(result.steps.includes('track animation progress'));
});

test('DeforumJob run includes audio processing step when audioFile provided', async () => {
  const job = new DeforumJob();
  const result = await job.run({
    frames: 60,
    audioFile: 'music.mp3'
  });
  
  assert.ok(result.steps.includes('process audio file'));
  assert.equal(result.audioFile, 'music.mp3');
});

test('DeforumJob run excludes audio step when no audioFile', async () => {
  const job = new DeforumJob();
  const result = await job.run({ frames: 60 });
  
  assert.ok(!result.steps.includes('process audio file'));
  assert.equal(result.audioFile, null);
});

test('DeforumJob run handles classic motion style with preset', async () => {
  const job = new DeforumJob();
  const preset = {
    name: 'Smooth Zoom',
    settings: {
      zoom: '0:(1.01)',
      angle: '0:(0)'
    }
  };
  
  const result = await job.run({
    frames: 60,
    motionStyle: 'classic',
    preset: preset
  });
  
  assert.equal(result.motionStyle, 'classic');
  assert.equal(result.preset, preset);
  assert.equal(result.settings.zoom, '0:(1.01)');
  assert.equal(result.settings.angle, '0:(0)');
});

test('DeforumJob run handles BPM motion style', async () => {
  const job = new DeforumJob();
  const result = await job.run({
    frames: 120,
    motionStyle: 'bpm',
    bpm: 120
  });
  
  assert.equal(result.motionStyle, 'bpm');
  assert.equal(result.bpm, 120);
  assert.equal(result.settings.bpm, 120);
  assert.equal(result.settings.motion_type, 'bpm_sync');
  assert.ok(result.settings.framesPerBeat);
  // At 120 BPM and 30 fps: 120 BPM = 2 beats/sec, so 30/2 = 15 frames per beat
  assert.equal(result.settings.framesPerBeat, 15);
});

test('DeforumJob run calculates frames per beat correctly', async () => {
  const job = new DeforumJob();
  
  // Test 60 BPM (1 beat per second)
  const result60 = await job.run({
    frames: 120,
    motionStyle: 'bpm',
    bpm: 60
  });
  assert.equal(result60.settings.framesPerBeat, 30); // 30 fps / 1 beat per sec
  
  // Test 90 BPM
  const result90 = await job.run({
    frames: 120,
    motionStyle: 'bpm',
    bpm: 90
  });
  assert.equal(result90.settings.framesPerBeat, 20); // 30 fps / 1.5 beats per sec
});

test('DeforumJob run handles audio_sync motion style', async () => {
  const job = new DeforumJob();
  const result = await job.run({
    frames: 120,
    motionStyle: 'audio_sync',
    audioFile: 'track.mp3'
  });
  
  assert.equal(result.motionStyle, 'audio_sync');
  assert.equal(result.settings.motion_type, 'audio_sync');
  assert.equal(result.settings.audio_reactive, true);
});

test('DeforumJob run handles empty payload', async () => {
  const job = new DeforumJob();
  const result = await job.run({});
  
  assert.equal(result.strategy, 'deforum');
  assert.equal(result.status, 'queued');
  assert.equal(result.motionStyle, 'classic');
  assert.equal(result.preset, null);
  assert.equal(result.bpm, null);
});

test('DeforumJob run handles null payload', async () => {
  const job = new DeforumJob();
  const result = await job.run(null);
  
  assert.equal(result.strategy, 'deforum');
  assert.equal(result.status, 'queued');
  assert.equal(result.motionStyle, 'classic');
});

test('DeforumJob run merges preset settings with custom settings', async () => {
  const job = new DeforumJob();
  const preset = {
    settings: {
      zoom: '0:(1.05)',
      angle: '0:(0)'
    }
  };
  
  const customSettings = {
    translation_x: '0:(0)',
    custom_param: 'value'
  };
  
  const result = await job.run({
    frames: 60,
    motionStyle: 'classic',
    preset: preset,
    settings: customSettings
  });
  
  assert.equal(result.settings.zoom, '0:(1.05)'); // from preset
  assert.equal(result.settings.angle, '0:(0)'); // from preset
  assert.equal(result.settings.translation_x, '0:(0)'); // from custom
  assert.equal(result.settings.custom_param, 'value'); // from custom
});

test('DeforumJob run preserves all input fields in result', async () => {
  const job = new DeforumJob();
  const result = await job.run({
    frames: 100,
    settings: { test: 'value' },
    audioFile: 'audio.mp3',
    motionStyle: 'bpm',
    preset: { name: 'Test' },
    bpm: 140
  });
  
  assert.equal(result.frames, 100);
  assert.equal(result.audioFile, 'audio.mp3');
  assert.equal(result.motionStyle, 'bpm');
  assert.deepEqual(result.preset, { name: 'Test' });
  assert.equal(result.bpm, 140);
});
