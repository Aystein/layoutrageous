import React from "react";
import { applyInsert, TreeState, updateGrowthValues } from "./layoutAdapter";
import { produce, WritableDraft } from "immer";

export type Updater<T> = T | ((updater: T) => T);

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
    direction: "left" | "right" | "top" | "bottom"
  ) => void;

  getState: () => TreeState<T>;

  // Returns a deep copy of the current state
  getDeepCopy: () => TreeState<T>;

  /**
   * Generates a new state by applying an updater function to a draft of the current state.
   * The updater function operates on an Immer draft, allowing direct mutations
   * without modifying the actual state.
   *
   * @param updater A function that mutates the draft state.
   */
  produce: (updater: (draft: WritableDraft<TreeState<T>>) => void) => void;

  /**
   * Applies an action to a draft of the current state.
   *
   * @param action A function that mutates the draft state.
   * @param args Additional arguments to pass to the action.
   */
  applyDraftAction: <Args extends any[]>(
    action: (draft: WritableDraft<TreeState<T>>, ...args: Args) => void,
    ...args: Args
  ) => void;
}

export function createLayout<T>(
  options: Partial<LayoutOptions<T>>
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
        typeof updater === "function" ? updater(coreInstance.options) : updater;

      coreInstance.options = newOptions;
    },
    setState: (updater) => {
      coreInstance.options.onStateChange?.(updater);
    },
    produce: (updater) => {
      coreInstance.setState((state) => {
        return produce(state, (draft) => {
          return updater(draft);
        });
      });
    },
    applyDraftAction<Args extends any[]>(
      action: (draft: WritableDraft<TreeState<T>>, ...args: Args) => void,
      ...args: Args
    ) {
      coreInstance.setState((state) => {
        return produce(state, (draft) => {
          action(draft, ...args);
        });
      });
    },
    applyInsert: (toMoveId, targetId, direction) => {
      coreInstance.applyDraftAction(applyInsert, toMoveId, targetId, direction);
    },
    updateGrowthValues: (growthValues) => {
      coreInstance.applyDraftAction(updateGrowthValues, growthValues);
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
    onStateChange: () => {},
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
        typeof updater === "function" ? updater(mergedState) : updater;
      setState(newState);
      options.onStateChange?.(newState);
    },
  }));

  return tableRef.current;
}
