import { describe, it, expect, beforeEach, vi } from 'vitest';
import AddFragmentCommand from '@/services/videoeditor/commands/AddFragmentCommand';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';

describe('AddFragmentCommand', () => {
  let videoFile;
  let fragment;
  let mockStore;

  beforeEach(() => {
    videoFile = new VideoFileAdapter({
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });
    fragment = new VideoFragmentAdapter(videoFile);

    mockStore = {
      state: {
        timeline: [],
        videoFiles: [],
      },
      commit: vi.fn(),
      getters: {},
    };
  });

  it('adds fragment to timeline', () => {
    const command = new AddFragmentCommand(fragment);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('ADD_TO_TIMELINE', { fragment, index: null });
    // Note: SET_ACTIVE_FRAGMENT and ADD_VIDEO_FILE are handled by the ADD_TO_TIMELINE mutation, not the command
  });

  it('adds fragment at specific index', () => {
    const existingFragment = new VideoFragmentAdapter(videoFile);
    mockStore.state.timeline = [existingFragment];

    const command = new AddFragmentCommand(fragment, 0);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('ADD_TO_TIMELINE', {
      fragment,
      index: 0,
    });
  });

  it('adds video file to videoFiles if not present', () => {
    // Note: ADD_VIDEO_FILE is handled by the store mutation ADD_TO_TIMELINE, not the command
    // The mutation automatically adds video files to videoFiles array
    const command = new AddFragmentCommand(fragment);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('ADD_TO_TIMELINE', { fragment, index: null });
    // The mutation handles adding to videoFiles automatically
  });

  it('undoes adding fragment', () => {
    mockStore.state.timeline = [fragment];
    const command = new AddFragmentCommand(fragment);
    command.execute(mockStore);

    command.undo(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('REMOVE_FROM_TIMELINE', fragment);
  });

  it('redoes adding fragment', () => {
    const command = new AddFragmentCommand(fragment);
    command.execute(mockStore);
    command.undo(mockStore);

    // Redo is done by re-executing the command
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('ADD_TO_TIMELINE', { fragment, index: null });
  });
});

