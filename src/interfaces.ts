import { DivideNode, Orientation, DivideContentNode } from "./layoutAdapter";


export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface Pos {
    x: number;
    y: number;
}



export interface DropRect {
    left: number;
    top: number;
    right: number;
    bottom: number;

    visible: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };

    action: {
        type: 'insert',
        position: 'left' | 'right' | 'top' | 'bottom',
        node: DivideNode<unknown>,
    };
}

export type RenderDividerFunction = (state: {
    orientation: Orientation,
    dragging: boolean,
}) => React.ReactNode;

export type RenderTileFunction<T> = (tile: DivideContentNode<T>) => React.ReactNode;

export type RenderHeaderFunction<T> = (tile: DivideContentNode<T>) => React.ReactNode;