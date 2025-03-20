export function offsetPosition(element: HTMLElement, event: MouseEvent) {
    const boundingRect = element.getBoundingClientRect();

    return {
        x: event.clientX - boundingRect.left - element.clientLeft,
        y: event.clientY - boundingRect.top - element.clientTop,
    };
}

export function distance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export interface MouseClickEvent {
    target: HTMLElement;

    x: number;
    y: number;

    clientX: number;
    clientY: number;
}

export interface DragEvent {
    target: HTMLElement;

    x: number;
    y: number;

    initialX: number;
    initialY: number;

    targetInitialX: number;
    targetInitialY: number;

    clientX: number;
    clientY: number;

    movementX: number;
    movementY: number;

    index: number;

    nativeEvent: MouseEvent;
}

export interface MouseDownEvent {
    target: HTMLElement;

    x: number;
    y: number;
    
    targetX: number;
    targetY: number;

    clientX: number;
    clientY: number;

    nativeEvent: MouseEvent;
}

export interface MouseUpEvent {
    target: HTMLElement;

    x: number;
    y: number;

    clientX: number;
    clientY: number;
}

export interface MouseMoveEvent {
    nativeEvent: MouseEvent;

    target: HTMLElement;

    x: number;
    y: number;

    clientX: number;
    clientY: number;

}

export type DragState = 'idle' | 'down' | 'dragging';

export class DragController {
    initialX: number = 0;
    initialY: number = 0;

    targetInitialX: number = 0;
    targetInitialY: number = 0;

    previousX: number = 0;
    previousY: number = 0;

    animationFrame?: number;

    target: HTMLElement | null = null;

    dragIndex: number = 0;

    state: DragState = 'idle';

    hasClickCapture: boolean = false;

    // Store last user select value
    userSelect: string = '';

    constructor(private element: HTMLElement, private callbacks: {
        // General events
        onMouseDown?: (event: MouseDownEvent) => void;
        onDrag?: (event: DragEvent) => void;
        onMouseUp?: (event: MouseUpEvent) => void;
        onClick?: (event: MouseClickEvent) => void;
        onMouseMove?: (event: MouseMoveEvent) => void;

        // Function to skip some interactions
        shouldSkip?: (event: MouseDownEvent) => boolean;

        // Throttle
        throttle?: boolean;

        minimumDragDistance?: number;
    }) {
        // Bind all methods to the instance
        this.mouseMove = this.mouseMove.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.mouseDown = this.mouseDown.bind(this);

        element.addEventListener('mousedown', this.mouseDown);
        element.addEventListener('mousemove', this.mouseMove);
    }

    mouseDown(event: MouseEvent) {
        const { x, y } = offsetPosition(this.element, event);
        const { x: targetInitialX, y: targetInitialY } = offsetPosition(event.target as HTMLElement, event);

        const mouseDownEvent: MouseDownEvent = {
            target: event.currentTarget as HTMLElement,
            x,
            y,
            targetX: targetInitialX,
            targetY: targetInitialY,
            clientX: event.clientX,
            clientY: event.clientY,
            nativeEvent: event,
        };

        if (this.callbacks.shouldSkip?.(mouseDownEvent)) {
            return;
        }

        event.stopImmediatePropagation();

        // Important: disable text selection globally when we are dragging
        if (event.view) {
            this.userSelect = event.view.document.documentElement.style.userSelect;
            event.view.document.documentElement.style.userSelect = 'none';
        }


        this.target = event.currentTarget as HTMLElement;

        this.initialX = x;
        this.initialY = y;

        this.targetInitialX = targetInitialX;
        this.targetInitialY = targetInitialY;

        this.previousX = x;
        this.previousY = y;

        this.state = 'down';

        this.callbacks.onMouseDown?.(mouseDownEvent);

        // Remove move listener for hover
        window.removeEventListener('mousemove', this.mouseMove);

        window.addEventListener('mousemove', this.mouseMove);
        window.addEventListener('mouseup', this.mouseUp);
    }

    addClickCapture(timestamp: number) {
        window.addEventListener('click', (e) => {
            if (performance.now() - timestamp < 200) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }, {
            once: true,
            capture: true,
        });
    }

    mouseMove(event: MouseEvent) {
        event.preventDefault();
        // event.stopImmediatePropagation();

        if (this.animationFrame !== undefined) {
            cancelAnimationFrame(this.animationFrame);
        }

        const tick = () => {
            const { x, y } = offsetPosition(this.element, event);

            if (this.state === 'down' && distance(this.targetInitialX, this.targetInitialY, x, y) > (this.callbacks.minimumDragDistance ?? 2)) {
                this.state = 'dragging';

                // First drag
                this.callbacks.onDrag?.({
                    target: this.target!,
                    x,
                    y,
                    initialX: this.initialX,
                    initialY: this.initialY,
                    targetInitialX: this.targetInitialX,
                    targetInitialY: this.targetInitialY,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    movementX: x - this.previousX,
                    movementY: y - this.previousY,
                    index: this.dragIndex,
                    nativeEvent: event,
                });

                this.dragIndex++;
                this.previousX = x;
                this.previousY = y;
            } else if (this.state === 'dragging') {
                this.callbacks.onDrag?.({
                    target: this.target!,
                    x,
                    y,
                    initialX: this.initialX,
                    initialY: this.initialY,
                    targetInitialX: this.targetInitialX,
                    targetInitialY: this.targetInitialY,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    movementX: x - this.previousX,
                    movementY: y - this.previousY,
                    index: this.dragIndex,
                    nativeEvent: event,
                });

                this.dragIndex++;
                this.previousX = x;
                this.previousY = y;
            } else if (this.state === 'idle') {
                this.callbacks.onMouseMove?.({
                    target: this.target!,
                    nativeEvent: event,
                    x,
                    y,
                    clientX: event.clientX,
                    clientY: event.clientY,
                });
            }

            // Invalidate frame
            this.animationFrame = undefined;
        };

        if (this.callbacks.throttle === true) {
            this.animationFrame = requestAnimationFrame(tick);
        } else {
            tick();
        }
    }

    mouseUp(event: MouseEvent) {
        // Do not let click event happen
        event.preventDefault();
        // event.stopImmediatePropagation();

        if (event.view) {
            event.view.document.documentElement.style.userSelect = this.userSelect;
        }
        
        // Case when we have another animation frame
        if (this.animationFrame !== undefined) {
            cancelAnimationFrame(this.animationFrame);
        }

        const { x, y } = offsetPosition(this.element, event);

        // Throw last drag event
        if (this.state === 'dragging') {
            this.callbacks.onDrag?.({
                target: this.target!,
                x,
                y,
                initialX: this.initialX,
                initialY: this.initialY,
                targetInitialX: this.targetInitialX,
                targetInitialY: this.targetInitialY,
                clientX: event.clientX,
                clientY: event.clientY,
                movementX: x - this.previousX,
                movementY: y - this.previousY,
                index: -1,
                nativeEvent: event,
            });

            this.addClickCapture(performance.now());
        }

        this.callbacks.onMouseUp?.({
            target: this.target!,
            x,
            y,
            clientX: event.clientX,
            clientY: event.clientY,
        });

        if (this.state === 'down') {
            this.callbacks.onClick?.({
                target: this.target!,
                x,
                y,
                clientX: event.clientX,
                clientY: event.clientY
            });
        }

        window.removeEventListener('mousemove', this.mouseMove);
        window.removeEventListener('mouseup', this.mouseUp);

        // Add move listener for hover
        window.addEventListener('mousemove', this.mouseMove);

        this.state = 'idle';
        this.dragIndex = 0;
    }

    disconnect() {
        this.element.removeEventListener('mousemove', this.mouseMove);
        this.element.removeEventListener('mousedown', this.mouseDown);
        window.removeEventListener('mousemove', this.mouseMove);
        window.removeEventListener('mouseup', this.mouseUp);
    }
}
