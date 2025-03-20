import React from 'react';
import {
  createTactileAdapter,
  TreeState,
} from './TreeAdapter';
import { produce } from 'immer';

export type Updater<T> = T | ((updater: T) => T);

const divideAdapter = createTactileAdapter({});

export interface LayoutOptions<T> {
  onStateChange: (updater: Updater<TreeState<T>>) => void;
  state: Partial<TreeState<T>>;
  initialState: Partial<TreeState<T>>;
}

export interface LayoutInstance<T> {
  initialState: TreeState<T>;
  options: Partial<LayoutOptions<T>>;

  setState: (updater: Updater<TreeState<T>>) => void;

  setOptions: (updater: Updater<Partial<LayoutOptions<T>>>) => void;

  updateGrowthValues: (growthValues: Record<string, number>) => void;
  applyInsert: (
    toMove: string,
    target: string,
    direction: 'left' | 'right' | 'top' | 'bottom',
  ) => void;
  addBestFitting: (data: T) => void;

  deleteNode: (id: string) => void;
  getState: () => TreeState<T>;

  // Returns a deep copy of the current state
  getDeepCopy: () => TreeState<T>;
}

export function createLayout<T>(
  options: Partial<LayoutOptions<T>>,
): LayoutInstance<T> {
  const coreInstance: LayoutInstance<T> = {
    options: {
      ...options,
    },
    initialState: (options.initialState ?? {}) as TreeState<T>,
    getState: () => {
      return coreInstance.options.state as TreeState<T>;
    },
    setOptions: (updater) => {
      const newOptions =
        typeof updater === 'function' ? updater(coreInstance.options) : updater;

      coreInstance.options = newOptions;
    },
    setState: (updater) => {
      coreInstance.options.onStateChange?.(updater);
    },
    deleteNode: (id) => {
      coreInstance.setState((state) => {
        return produce(state, (draft) => {
          divideAdapter.deleteNode(draft, id);
        });
      });
    },
    addBestFitting: (data: T) => {
      console.log(data);
      coreInstance.setState((state) => {
        return produce(state, (draft) => {
          divideAdapter.greedySplit(draft, data);
        });
      });
    },
    applyInsert: (toMoveId, targetId, direction) => {
      coreInstance.setState((state) => {
        return produce(state, (draft) => {
          divideAdapter.applyInsert(draft, toMoveId, targetId, direction);
        });
      });
    },
    updateGrowthValues: (growthValues) => {
      coreInstance.setState((state) => {
        return produce(state, (draft) => {
          divideAdapter.updateGrowthValues(draft, growthValues);
        });
      });
    },
    getDeepCopy: () => {
      return JSON.parse(JSON.stringify(coreInstance.getState()));
    },
  };

  return coreInstance;
}

export function useLayout<T>(options: Partial<LayoutOptions<T>>) {
  const resolvedOptions: Partial<LayoutOptions<T>> = {
    state: {},
    onStateChange: () => { },
    ...options,
  };

  const [tableRef] = React.useState(() => ({
    current: createLayout(resolvedOptions),
  }));

  const [state, setState] = React.useState(() => ({
    ...tableRef.current.initialState,
    ...options.state,
  }));

  const mergedState = {
    ...state,
    ...options.state,
  };

  tableRef.current.setOptions((prev) => ({
    ...prev,
    ...options,
    state: mergedState,
    onStateChange: (updater) => {
      // Apply updater to current merged state
      const newState =
        typeof updater === 'function' ? updater(mergedState) : updater;
      setState(newState);
      options.onStateChange?.(newState);
    },
  }));

  return tableRef.current;
}
