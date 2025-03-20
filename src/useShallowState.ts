import React from "react";

export function useShallowState<T extends Record<string, unknown>>(initialState: T) {
    const [state, setState] = React.useState(initialState);

    const internalSetter = React.useCallback((updater: Partial<T> | ((state: T) => Partial<T>)) => {
        setState((prev) => {
            const newState = typeof updater === 'function' ? updater(prev) : updater;
            return { ...prev, ...newState };
        });
    }, []);

    return [state, internalSetter] as const;
}