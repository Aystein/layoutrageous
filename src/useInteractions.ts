import * as React from 'react';
import { DragController, DragEvent, MouseClickEvent, MouseDownEvent, MouseMoveEvent } from './DragController';
import { useSetRef } from './useSetRef';

interface UseInteractionsProps {
    shouldSkip?: (event: MouseDownEvent) => boolean;

    /**
     * The minimum distance the mouse has to be dragged before the onDrag event is emitted.
     */
    minimumDragDistance?: number;

    /**
     * Called when the mouse hast been dragged at least minimumDragDistance
     * pixels from the start point. This event is emitted at max once per frame.
     */
    onDrag?: (event: DragEvent) => void;

    /**
     * Called when the mouse has been clicked and NOT dragged at least minimumDragDistance pixels.
     */
    onClick?: (event: MouseClickEvent) => void;

    /**
     * Called when the mouse moves over the element while not dragging.
     */
    onMouseMove?: (position: MouseMoveEvent) => void;

    /**
     * Called when the mouse is released.
     */
    onMouseUp?: (event: MouseClickEvent) => void;

    /**
     * If set to overlay, a full screen overlay div will be added to the dom
     * after the mouse down event. This is useful if you want to preserve the
     * cursor of the element while dragging.
     *
     * Otherwise the window will be used as the target for mouse move events.
     */
    moveTarget?: 'window' | 'overlay';

    throttle?: boolean;
}

/**
 * supports interactions like drag, mousemove etc with an overlay div in the dom
 */
export function useInteractions(options: UseInteractionsProps = {}) {
    const optionsRef = React.useRef(options);
    optionsRef.current = options;

    const { ref, setRef } = useSetRef((element) => {
        let controller: DragController | null = null;

        if (element) {
            controller = new DragController(element, {
                minimumDragDistance: optionsRef.current.minimumDragDistance,
                onClick(event) {
                    optionsRef.current.onClick?.(event);
                },
                onDrag(event) {
                    optionsRef.current.onDrag?.(event);
                },
                onMouseMove(event) {
                    optionsRef.current.onMouseMove?.(event);
                },
                shouldSkip(event) {
                    return optionsRef.current.shouldSkip?.(event) ?? false;
                },
                throttle: optionsRef.current.throttle,
            });
        }

        return () => {
            controller?.disconnect();
        };
    });

    return { ref, setRef };
}