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
        timeline: [fragment],
        activeFragment: fragment,
        player: {
          progress: 0.5,
        },
      },
      commit: vi.fn(),
      getters: {},
    };
  });

  it('splits fragment at current progress position', () => {
    const command = new SplitFragmentCommand(fragment, 0.5);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('ADD_TO_TIMELINE', expect.objectContaining({
      fragment: expect.any(VideoFragmentAdapter),
      index: expect.any(Number),
    }));
  });

  it('creates two fragments from split', () => {
    const command = new SplitFragmentCommand(fragment, 0.5);
    command.execute(mockStore);

    // Original fragment end is updated to split point
    expect(fragment.end).toBe(0.5);
    // New fragment is created and added
    expect(command.newFragment).toBeDefined();
    expect(command.newFragment.start).toBe(0.5);
    expect(command.newFragment.end).toBe(1);
    expect(mockStore.commit).toHaveBeenCalledWith('ADD_TO_TIMELINE', expect.objectContaining({
      fragment: command.newFragment,
    }));
  });

  it('undoes split by restoring original fragment', () => {
    const command = new SplitFragmentCommand(fragment, 0.5);
    const originalEnd = fragment.end; // Store original end before split
    command.execute(mockStore);

    // Fragment end should now be 0.5 after split
    expect(fragment.end).toBe(0.5);
    
    command.undo(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('REMOVE_FROM_TIMELINE', command.newFragment);
    expect(fragment.end).toBe(originalEnd); // Restored to original end
  });

  it('redoes split', () => {
    const command = new SplitFragmentCommand(fragment, 0.5);
    command.execute(mockStore);
    command.undo(mockStore);

    // Redo is done by re-executing the command
    command.execute(mockStore);

    expect(fragment.end).toBe(0.5);
    expect(command.newFragment).toBeDefined();
    expect(mockStore.commit).toHaveBeenCalledWith('ADD_TO_TIMELINE', expect.objectContaining({
      fragment: expect.any(VideoFragmentAdapter),
    }));
  });
});

