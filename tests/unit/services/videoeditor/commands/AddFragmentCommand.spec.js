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
        videoeditor: {
          timeline: [],
          videoFiles: [],
        },
      },
      commit: vi.fn(),
    };
  });

  it('adds fragment to timeline', () => {
    const command = new AddFragmentCommand(fragment);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/ADD_FRAGMENT', { fragment });
    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/SET_ACTIVE_FRAGMENT', fragment);
  });

  it('adds fragment at specific index', () => {
    const existingFragment = new VideoFragmentAdapter(videoFile);
    mockStore.state.videoeditor.timeline = [existingFragment];

    const command = new AddFragmentCommand(fragment, 0);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/ADD_FRAGMENT_AT', {
      fragment,
      index: 0,
    });
  });

  it('adds video file to videoFiles if not present', () => {
    const command = new AddFragmentCommand(fragment);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/ADD_VIDEO_FILE', videoFile);
  });

  it('undoes adding fragment', () => {
    mockStore.state.videoeditor.timeline = [fragment];
    const command = new AddFragmentCommand(fragment);
    command.execute(mockStore);

    command.undo(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/REMOVE_FRAGMENT', fragment);
  });

  it('redoes adding fragment', () => {
    const command = new AddFragmentCommand(fragment);
    command.execute(mockStore);
    command.undo(mockStore);

    command.redo(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/ADD_FRAGMENT', { fragment });
  });
});

