import * as React from "react";
import { useSetRef } from "./useSetRef";

export type UseResizeObserverProps = {
    box?: 'border-box' | 'content-box' | 'device-pixel-content-box';
};

export function useResizeObserver(props?: UseResizeObserverProps) {
    const [state, setState] = React.useState<{ inlineSize: number, blockSize: number }>(
        { inlineSize: 0, blockSize: 0 }
    );

    const { ref, setRef } = useSetRef((element) => {
        const observer = new ResizeObserver((entries) => {
            switch (props?.box ?? 'content-box') {
                case 'border-box': {
                    const entry = entries[0].borderBoxSize[0];
                    if (entry) {
                        setState({ blockSize: entry.blockSize, inlineSize: entry.inlineSize });
                    }
                    break;
                }
                case 'content-box': {
                    const entry = entries[0].contentBoxSize[0];
                    if (entry) {
                        setState({ blockSize: entry.blockSize, inlineSize: entry.inlineSize });
                    }
                    break;
                }
                case 'device-pixel-content-box': {
                    const entry = entries[0].devicePixelContentBoxSize[0];
                    if (entry) {
                        setState({ blockSize: entry.blockSize, inlineSize: entry.inlineSize });
                    }
                    break;
                }
            }
        });

        if (element) {
            observer.observe(element);
        }

        return () => {
            observer.disconnect();
        };
    });

    return { ref, setRef, ...state };
}