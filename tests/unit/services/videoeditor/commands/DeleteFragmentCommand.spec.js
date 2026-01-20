import { describe, it, expect, beforeEach, vi } from 'vitest';
import DeleteFragmentCommand from '@/services/videoeditor/commands/DeleteFragmentCommand';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';

describe('DeleteFragmentCommand', () => {
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
          timeline: [fragment],
          activeFragment: fragment,
        },
      },
      commit: vi.fn(),
    };
  });

  it('removes fragment from timeline', () => {
    const command = new DeleteFragmentCommand(fragment);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/REMOVE_FRAGMENT', fragment);
  });

  it('clears active fragment if it was deleted', () => {
    const command = new DeleteFragmentCommand(fragment);
    command.execute(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/SET_ACTIVE_FRAGMENT', null);
  });

  it('stores fragment index for undo', () => {
    const fragment2 = new VideoFragmentAdapter(videoFile);
    mockStore.state.videoeditor.timeline = [fragment, fragment2];

    const command = new DeleteFragmentCommand(fragment2);
    command.execute(mockStore);

    expect(command.originalIndex).toBe(1);
  });

  it('undoes deleting fragment', () => {
    const command = new DeleteFragmentCommand(fragment);
    command.execute(mockStore);
    command.originalIndex = 0;

    command.undo(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/ADD_FRAGMENT_AT', {
      fragment,
      index: 0,
    });
    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/SET_ACTIVE_FRAGMENT', fragment);
  });

  it('redoes deleting fragment', () => {
    const command = new DeleteFragmentCommand(fragment);
    command.execute(mockStore);
    command.undo(mockStore);

    command.redo(mockStore);

    expect(mockStore.commit).toHaveBeenCalledWith('videoeditor/REMOVE_FRAGMENT', fragment);
  });
});

