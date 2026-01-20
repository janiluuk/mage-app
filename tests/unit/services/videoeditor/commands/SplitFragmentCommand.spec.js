import { describe, it, expect, beforeEach, vi } from 'vitest';
import SplitFragmentCommand from '@/services/videoeditor/commands/SplitFragmentCommand';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';

describe('SplitFragmentCommand', () => {
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
    fragment.start = 0;
    fragment.end = 1;

    mockStore = {
      state: {
        videoeditor: {
          timeline: [fragment],
          activeFragment: fragment,
          player: {
            progress: 0.5,
          },
        },
      },
      commit: vi.fn(),
    };
  });

  it('splits fragment at current progress position', () => {
    const command = new SplitFragmentCommand();
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/REMOVE_FRAGMENT', fragment);
    expect(mockStore.commit).toHaveBeenCalledTimes(4); // Remove, Add (x2), Set Active
  });

  it('creates two fragments from split', () => {
    const command = new SplitFragmentCommand();
    command.execute(mockStore);

    const addFragmentCalls = mockStore.commit.mock.calls.filter(
      (call) => call[0] === 'videoeditor/ADD_FRAGMENT'
    );
    expect(addFragmentCalls.length).toBe(2);
  });

  it('undoes split by restoring original fragment', () => {
    const command = new SplitFragmentCommand();
    command.execute(mockStore);

    command.undo(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/REMOVE_FRAGMENT', expect.any(VideoFragmentAdapter));
    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/ADD_FRAGMENT', { fragment });
  });

  it('redoes split', () => {
    const command = new SplitFragmentCommand();
    command.execute(mockStore);
    command.undo(mockStore);

    command.redo(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/REMOVE_FRAGMENT', fragment);
  });
});

