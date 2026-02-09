import { describe, it, expect, beforeEach } from 'vitest';
import mutations from '@/store/modules/film-project/mutations';
import * as types from '@/store/modules/film-project/types/mutations';

const freshState = () => ({
  projects: {},
  project: {},
  sequences: {},
  sequence: {},
  shots: {},
  shot: {},
  isLoading: false,
  error: null,
  currentProjectId: null,
  currentSequenceId: null,
});

describe('FilmProject mutations', () => {
  let state;

  beforeEach(() => {
    state = freshState();
  });

  // ── Projects ────────────────────────────────────────────────────

  describe('SET_PRODUCTIONS', () => {
    it('sets the projects map', () => {
      const projects = { 1: { id: 1, name: 'A' }, 2: { id: 2, name: 'B' } };
      mutations[types.SET_PRODUCTIONS](state, projects);
      expect(state.projects).toEqual(projects);
    });
  });

  describe('SET_PRODUCTION', () => {
    it('sets the current project and adds to map', () => {
      const project = { id: 5, name: 'Film' };
      mutations[types.SET_PRODUCTION](state, project);
      expect(state.project).toEqual(project);
      expect(state.projects[5]).toEqual(project);
    });

    it('handles null project gracefully', () => {
      mutations[types.SET_PRODUCTION](state, null);
      expect(state.project).toBeNull();
    });
  });

  describe('ADD_PRODUCTION', () => {
    it('adds a project to the map', () => {
      const project = { id: 3, name: 'New' };
      mutations[types.ADD_PRODUCTION](state, project);
      expect(state.projects[3]).toEqual(project);
    });

    it('ignores project without id', () => {
      mutations[types.ADD_PRODUCTION](state, {});
      expect(Object.keys(state.projects)).toHaveLength(0);
    });
  });

  describe('UPDATE_PRODUCTION_STATE', () => {
    it('merges updates into project map entry', () => {
      state.projects[1] = { id: 1, name: 'Old', status: 'draft' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'New' } });
      expect(state.projects[1].name).toBe('New');
      expect(state.projects[1].status).toBe('draft');
    });

    it('also updates current project if it matches', () => {
      state.project = { id: 1, name: 'Old' };
      state.projects[1] = { id: 1, name: 'Old' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'Updated' } });
      expect(state.project.name).toBe('Updated');
    });

    it('does not touch current project if ids differ', () => {
      state.project = { id: 2, name: 'Other' };
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'B' } });
      expect(state.project.name).toBe('Other');
    });
  });

  describe('REMOVE_PRODUCTION', () => {
    it('removes project from map', () => {
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.REMOVE_PRODUCTION](state, 1);
      expect(state.projects[1]).toBeUndefined();
    });

    it('clears current project if it was the one removed', () => {
      state.project = { id: 1, name: 'A' };
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.REMOVE_PRODUCTION](state, 1);
      expect(state.project).toEqual({});
    });
  });

  // ── Sequences ──────────────────────────────────────────────────

  describe('SET_SEQUENCES', () => {
    it('sets the sequences map', () => {
      const seqs = { 10: { id: 10, name: 'Act 1' } };
      mutations[types.SET_SEQUENCES](state, seqs);
      expect(state.sequences).toEqual(seqs);
    });
  });

  describe('SET_SEQUENCE', () => {
    it('sets current sequence and adds to map', () => {
      const seq = { id: 10, name: 'Act 1' };
      mutations[types.SET_SEQUENCE](state, seq);
      expect(state.sequence).toEqual(seq);
      expect(state.sequences[10]).toEqual(seq);
    });
  });

  describe('ADD_SEQUENCE', () => {
    it('adds a sequence to the map', () => {
      mutations[types.ADD_SEQUENCE](state, { id: 20, name: 'Act 2' });
      expect(state.sequences[20]).toEqual({ id: 20, name: 'Act 2' });
    });
  });

  describe('UPDATE_SEQUENCE_STATE', () => {
    it('merges updates into sequence map entry', () => {
      state.sequences[10] = { id: 10, name: 'Old', order: 1 };
      mutations[types.UPDATE_SEQUENCE_STATE](state, { id: 10, data: { name: 'New' } });
      expect(state.sequences[10].name).toBe('New');
      expect(state.sequences[10].order).toBe(1);
    });
  });

  describe('REMOVE_SEQUENCE', () => {
    it('removes sequence from map', () => {
      state.sequences[10] = { id: 10 };
      mutations[types.REMOVE_SEQUENCE](state, 10);
      expect(state.sequences[10]).toBeUndefined();
    });
  });

  // ── Shots ─────────────────────────────────────────────────────

  describe('SET_SHOTS', () => {
    it('merges new shots into existing map', () => {
      state.shots = { 100: { id: 100, name: 'Existing' } };
      mutations[types.SET_SHOTS](state, { 200: { id: 200, name: 'New' } });
      expect(state.shots[100]).toBeDefined();
      expect(state.shots[200]).toBeDefined();
    });

    it('overwrites same-id shots with newer data', () => {
      state.shots = { 100: { id: 100, name: 'Old' } };
      mutations[types.SET_SHOTS](state, { 100: { id: 100, name: 'Updated' } });
      expect(state.shots[100].name).toBe('Updated');
    });
  });

  describe('SET_SHOT', () => {
    it('sets current shot and adds to map', () => {
      const shot = { id: 100, name: 'Wide Shot' };
      mutations[types.SET_SHOT](state, shot);
      expect(state.shot).toEqual(shot);
      expect(state.shots[100]).toEqual(shot);
    });
  });

  describe('ADD_SHOT', () => {
    it('adds a shot to the map', () => {
      mutations[types.ADD_SHOT](state, { id: 300, name: 'Close-up' });
      expect(state.shots[300]).toEqual({ id: 300, name: 'Close-up' });
    });
  });

  describe('UPDATE_SHOT_STATE', () => {
    it('merges updates into shot map entry', () => {
      state.shots[100] = { id: 100, name: 'Old', duration: 5 };
      mutations[types.UPDATE_SHOT_STATE](state, { id: 100, data: { name: 'New' } });
      expect(state.shots[100].name).toBe('New');
      expect(state.shots[100].duration).toBe(5);
    });

    it('also updates current shot if it matches', () => {
      state.shot = { id: 100, name: 'Old' };
      state.shots[100] = { id: 100, name: 'Old' };
      mutations[types.UPDATE_SHOT_STATE](state, { id: 100, data: { name: 'Edited' } });
      expect(state.shot.name).toBe('Edited');
    });
  });

  describe('REMOVE_SHOT', () => {
    it('removes shot from map', () => {
      state.shots[100] = { id: 100 };
      mutations[types.REMOVE_SHOT](state, 100);
      expect(state.shots[100]).toBeUndefined();
    });
  });

  // ── Loading / Error / Current ──────────────────────────────────

  describe('SET_LOADING', () => {
    it('sets loading state', () => {
      mutations[types.SET_LOADING](state, true);
      expect(state.isLoading).toBe(true);
      mutations[types.SET_LOADING](state, false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('sets error', () => {
      const err = new Error('fail');
      mutations[types.SET_ERROR](state, err);
      expect(state.error).toBe(err);
    });
  });

  describe('SET_CURRENT_PRODUCTION', () => {
    it('sets current project id', () => {
      mutations[types.SET_CURRENT_PRODUCTION](state, 42);
      expect(state.currentProjectId).toBe(42);
    });
  });

  describe('SET_CURRENT_SEQUENCE', () => {
    it('sets current sequence id', () => {
      mutations[types.SET_CURRENT_SEQUENCE](state, 77);
      expect(state.currentSequenceId).toBe(77);
    });
  });
});

import mutations from '@/store/modules/film-project/mutations';
import * as types from '@/store/modules/film-project/types/mutations';

const freshState = () => ({
  projects: {},
  project: {},
  sequences: {},
  sequence: {},
  shots: {},
  shot: {},
  isLoading: false,
  error: null,
  currentProjectId: null,
  currentSequenceId: null,
});

describe('FilmProject mutations', () => {
  let state;

  beforeEach(() => {
    state = freshState();
  });

  // ── Projects ────────────────────────────────────────────────────

  describe('SET_PRODUCTIONS', () => {
    it('sets the projects map', () => {
      const projects = { 1: { id: 1, name: 'A' }, 2: { id: 2, name: 'B' } };
      mutations[types.SET_PRODUCTIONS](state, projects);
      expect(state.projects).toEqual(projects);
    });
  });

  describe('SET_PRODUCTION', () => {
    it('sets the current project and adds to map', () => {
      const project = { id: 5, name: 'Film' };
      mutations[types.SET_PRODUCTION](state, project);
      expect(state.project).toEqual(project);
      expect(state.projects[5]).toEqual(project);
    });

    it('handles null project gracefully', () => {
      mutations[types.SET_PRODUCTION](state, null);
      expect(state.project).toBeNull();
    });
  });

  describe('ADD_PRODUCTION', () => {
    it('adds a project to the map', () => {
      const project = { id: 3, name: 'New' };
      mutations[types.ADD_PRODUCTION](state, project);
      expect(state.projects[3]).toEqual(project);
    });

    it('ignores project without id', () => {
      mutations[types.ADD_PRODUCTION](state, {});
      expect(Object.keys(state.projects)).toHaveLength(0);
    });
  });

  describe('UPDATE_PRODUCTION_STATE', () => {
    it('merges updates into project map entry', () => {
      state.projects[1] = { id: 1, name: 'Old', status: 'draft' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'New' } });
      expect(state.projects[1].name).toBe('New');
      expect(state.projects[1].status).toBe('draft');
    });

    it('also updates current project if it matches', () => {
      state.project = { id: 1, name: 'Old' };
      state.projects[1] = { id: 1, name: 'Old' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'Updated' } });
      expect(state.project.name).toBe('Updated');
    });

    it('does not touch current project if ids differ', () => {
      state.project = { id: 2, name: 'Other' };
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'B' } });
      expect(state.project.name).toBe('Other');
    });
  });

  describe('REMOVE_PRODUCTION', () => {
    it('removes project from map', () => {
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.REMOVE_PRODUCTION](state, 1);
      expect(state.projects[1]).toBeUndefined();
    });

    it('clears current project if it was the one removed', () => {
      state.project = { id: 1, name: 'A' };
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.REMOVE_PRODUCTION](state, 1);
      expect(state.project).toEqual({});
    });
  });

  // ── Sequences ──────────────────────────────────────────────────

  describe('SET_SEQUENCES', () => {
    it('sets the sequences map', () => {
      const seqs = { 10: { id: 10, name: 'Act 1' } };
      mutations[types.SET_SEQUENCES](state, seqs);
      expect(state.sequences).toEqual(seqs);
    });
  });

  describe('SET_SEQUENCE', () => {
    it('sets current sequence and adds to map', () => {
      const seq = { id: 10, name: 'Act 1' };
      mutations[types.SET_SEQUENCE](state, seq);
      expect(state.sequence).toEqual(seq);
      expect(state.sequences[10]).toEqual(seq);
    });
  });

  describe('ADD_SEQUENCE', () => {
    it('adds a sequence to the map', () => {
      mutations[types.ADD_SEQUENCE](state, { id: 20, name: 'Act 2' });
      expect(state.sequences[20]).toEqual({ id: 20, name: 'Act 2' });
    });
  });

  describe('UPDATE_SEQUENCE_STATE', () => {
    it('merges updates into sequence map entry', () => {
      state.sequences[10] = { id: 10, name: 'Old', order: 1 };
      mutations[types.UPDATE_SEQUENCE_STATE](state, { id: 10, data: { name: 'New' } });
      expect(state.sequences[10].name).toBe('New');
      expect(state.sequences[10].order).toBe(1);
    });
  });

  describe('REMOVE_SEQUENCE', () => {
    it('removes sequence from map', () => {
      state.sequences[10] = { id: 10 };
      mutations[types.REMOVE_SEQUENCE](state, 10);
      expect(state.sequences[10]).toBeUndefined();
    });
  });

  // ── Shots ─────────────────────────────────────────────────────

  describe('SET_SHOTS', () => {
    it('merges new shots into existing map', () => {
      state.shots = { 100: { id: 100, name: 'Existing' } };
      mutations[types.SET_SHOTS](state, { 200: { id: 200, name: 'New' } });
      expect(state.shots[100]).toBeDefined();
      expect(state.shots[200]).toBeDefined();
    });

    it('overwrites same-id shots with newer data', () => {
      state.shots = { 100: { id: 100, name: 'Old' } };
      mutations[types.SET_SHOTS](state, { 100: { id: 100, name: 'Updated' } });
      expect(state.shots[100].name).toBe('Updated');
    });
  });

  describe('SET_SHOT', () => {
    it('sets current shot and adds to map', () => {
      const shot = { id: 100, name: 'Wide Shot' };
      mutations[types.SET_SHOT](state, shot);
      expect(state.shot).toEqual(shot);
      expect(state.shots[100]).toEqual(shot);
    });
  });

  describe('ADD_SHOT', () => {
    it('adds a shot to the map', () => {
      mutations[types.ADD_SHOT](state, { id: 300, name: 'Close-up' });
      expect(state.shots[300]).toEqual({ id: 300, name: 'Close-up' });
    });
  });

  describe('UPDATE_SHOT_STATE', () => {
    it('merges updates into shot map entry', () => {
      state.shots[100] = { id: 100, name: 'Old', duration: 5 };
      mutations[types.UPDATE_SHOT_STATE](state, { id: 100, data: { name: 'New' } });
      expect(state.shots[100].name).toBe('New');
      expect(state.shots[100].duration).toBe(5);
    });

    it('also updates current shot if it matches', () => {
      state.shot = { id: 100, name: 'Old' };
      state.shots[100] = { id: 100, name: 'Old' };
      mutations[types.UPDATE_SHOT_STATE](state, { id: 100, data: { name: 'Edited' } });
      expect(state.shot.name).toBe('Edited');
    });
  });

  describe('REMOVE_SHOT', () => {
    it('removes shot from map', () => {
      state.shots[100] = { id: 100 };
      mutations[types.REMOVE_SHOT](state, 100);
      expect(state.shots[100]).toBeUndefined();
    });
  });

  // ── Loading / Error / Current ──────────────────────────────────

  describe('SET_LOADING', () => {
    it('sets loading state', () => {
      mutations[types.SET_LOADING](state, true);
      expect(state.isLoading).toBe(true);
      mutations[types.SET_LOADING](state, false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('sets error', () => {
      const err = new Error('fail');
      mutations[types.SET_ERROR](state, err);
      expect(state.error).toBe(err);
    });
  });

  describe('SET_CURRENT_PRODUCTION', () => {
    it('sets current project id', () => {
      mutations[types.SET_CURRENT_PRODUCTION](state, 42);
      expect(state.currentProjectId).toBe(42);
    });
  });

  describe('SET_CURRENT_SEQUENCE', () => {
    it('sets current sequence id', () => {
      mutations[types.SET_CURRENT_SEQUENCE](state, 77);
      expect(state.currentSequenceId).toBe(77);
    });
  });
});

import mutations from '@/store/modules/film-project/mutations';
import * as types from '@/store/modules/film-project/types/mutations';

const freshState = () => ({
  projects: {},
  project: {},
  sequences: {},
  sequence: {},
  shots: {},
  shot: {},
  isLoading: false,
  error: null,
  currentProjectId: null,
  currentSequenceId: null,
});

describe('FilmProject mutations', () => {
  let state;

  beforeEach(() => {
    state = freshState();
  });

  // ── Projects ────────────────────────────────────────────────────

  describe('SET_PRODUCTIONS', () => {
    it('sets the projects map', () => {
      const projects = { 1: { id: 1, name: 'A' }, 2: { id: 2, name: 'B' } };
      mutations[types.SET_PRODUCTIONS](state, projects);
      expect(state.projects).toEqual(projects);
    });
  });

  describe('SET_PRODUCTION', () => {
    it('sets the current project and adds to map', () => {
      const project = { id: 5, name: 'Film' };
      mutations[types.SET_PRODUCTION](state, project);
      expect(state.project).toEqual(project);
      expect(state.projects[5]).toEqual(project);
    });

    it('handles null project gracefully', () => {
      mutations[types.SET_PRODUCTION](state, null);
      expect(state.project).toBeNull();
    });
  });

  describe('ADD_PRODUCTION', () => {
    it('adds a project to the map', () => {
      const project = { id: 3, name: 'New' };
      mutations[types.ADD_PRODUCTION](state, project);
      expect(state.projects[3]).toEqual(project);
    });

    it('ignores project without id', () => {
      mutations[types.ADD_PRODUCTION](state, {});
      expect(Object.keys(state.projects)).toHaveLength(0);
    });
  });

  describe('UPDATE_PRODUCTION_STATE', () => {
    it('merges updates into project map entry', () => {
      state.projects[1] = { id: 1, name: 'Old', status: 'draft' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'New' } });
      expect(state.projects[1].name).toBe('New');
      expect(state.projects[1].status).toBe('draft');
    });

    it('also updates current project if it matches', () => {
      state.project = { id: 1, name: 'Old' };
      state.projects[1] = { id: 1, name: 'Old' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'Updated' } });
      expect(state.project.name).toBe('Updated');
    });

    it('does not touch current project if ids differ', () => {
      state.project = { id: 2, name: 'Other' };
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.UPDATE_PRODUCTION_STATE](state, { id: 1, data: { name: 'B' } });
      expect(state.project.name).toBe('Other');
    });
  });

  describe('REMOVE_PRODUCTION', () => {
    it('removes project from map', () => {
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.REMOVE_PRODUCTION](state, 1);
      expect(state.projects[1]).toBeUndefined();
    });

    it('clears current project if it was the one removed', () => {
      state.project = { id: 1, name: 'A' };
      state.projects[1] = { id: 1, name: 'A' };
      mutations[types.REMOVE_PRODUCTION](state, 1);
      expect(state.project).toEqual({});
    });
  });

  // ── Sequences ──────────────────────────────────────────────────

  describe('SET_SEQUENCES', () => {
    it('sets the sequences map', () => {
      const seqs = { 10: { id: 10, name: 'Act 1' } };
      mutations[types.SET_SEQUENCES](state, seqs);
      expect(state.sequences).toEqual(seqs);
    });
  });

  describe('SET_SEQUENCE', () => {
    it('sets current sequence and adds to map', () => {
      const seq = { id: 10, name: 'Act 1' };
      mutations[types.SET_SEQUENCE](state, seq);
      expect(state.sequence).toEqual(seq);
      expect(state.sequences[10]).toEqual(seq);
    });
  });

  describe('ADD_SEQUENCE', () => {
    it('adds a sequence to the map', () => {
      mutations[types.ADD_SEQUENCE](state, { id: 20, name: 'Act 2' });
      expect(state.sequences[20]).toEqual({ id: 20, name: 'Act 2' });
    });
  });

  describe('UPDATE_SEQUENCE_STATE', () => {
    it('merges updates into sequence map entry', () => {
      state.sequences[10] = { id: 10, name: 'Old', order: 1 };
      mutations[types.UPDATE_SEQUENCE_STATE](state, { id: 10, data: { name: 'New' } });
      expect(state.sequences[10].name).toBe('New');
      expect(state.sequences[10].order).toBe(1);
    });
  });

  describe('REMOVE_SEQUENCE', () => {
    it('removes sequence from map', () => {
      state.sequences[10] = { id: 10 };
      mutations[types.REMOVE_SEQUENCE](state, 10);
      expect(state.sequences[10]).toBeUndefined();
    });
  });

  // ── Shots ─────────────────────────────────────────────────────

  describe('SET_SHOTS', () => {
    it('merges new shots into existing map', () => {
      state.shots = { 100: { id: 100, name: 'Existing' } };
      mutations[types.SET_SHOTS](state, { 200: { id: 200, name: 'New' } });
      expect(state.shots[100]).toBeDefined();
      expect(state.shots[200]).toBeDefined();
    });

    it('overwrites same-id shots with newer data', () => {
      state.shots = { 100: { id: 100, name: 'Old' } };
      mutations[types.SET_SHOTS](state, { 100: { id: 100, name: 'Updated' } });
      expect(state.shots[100].name).toBe('Updated');
    });
  });

  describe('SET_SHOT', () => {
    it('sets current shot and adds to map', () => {
      const shot = { id: 100, name: 'Wide Shot' };
      mutations[types.SET_SHOT](state, shot);
      expect(state.shot).toEqual(shot);
      expect(state.shots[100]).toEqual(shot);
    });
  });

  describe('ADD_SHOT', () => {
    it('adds a shot to the map', () => {
      mutations[types.ADD_SHOT](state, { id: 300, name: 'Close-up' });
      expect(state.shots[300]).toEqual({ id: 300, name: 'Close-up' });
    });
  });

  describe('UPDATE_SHOT_STATE', () => {
    it('merges updates into shot map entry', () => {
      state.shots[100] = { id: 100, name: 'Old', duration: 5 };
      mutations[types.UPDATE_SHOT_STATE](state, { id: 100, data: { name: 'New' } });
      expect(state.shots[100].name).toBe('New');
      expect(state.shots[100].duration).toBe(5);
    });

    it('also updates current shot if it matches', () => {
      state.shot = { id: 100, name: 'Old' };
      state.shots[100] = { id: 100, name: 'Old' };
      mutations[types.UPDATE_SHOT_STATE](state, { id: 100, data: { name: 'Edited' } });
      expect(state.shot.name).toBe('Edited');
    });
  });

  describe('REMOVE_SHOT', () => {
    it('removes shot from map', () => {
      state.shots[100] = { id: 100 };
      mutations[types.REMOVE_SHOT](state, 100);
      expect(state.shots[100]).toBeUndefined();
    });
  });

  // ── Loading / Error / Current ──────────────────────────────────

  describe('SET_LOADING', () => {
    it('sets loading state', () => {
      mutations[types.SET_LOADING](state, true);
      expect(state.isLoading).toBe(true);
      mutations[types.SET_LOADING](state, false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('sets error', () => {
      const err = new Error('fail');
      mutations[types.SET_ERROR](state, err);
      expect(state.error).toBe(err);
    });
  });

  describe('SET_CURRENT_PRODUCTION', () => {
    it('sets current project id', () => {
      mutations[types.SET_CURRENT_PRODUCTION](state, 42);
      expect(state.currentProjectId).toBe(42);
    });
  });

  describe('SET_CURRENT_SEQUENCE', () => {
    it('sets current sequence id', () => {
      mutations[types.SET_CURRENT_SEQUENCE](state, 77);
      expect(state.currentSequenceId).toBe(77);
    });
  });
});

