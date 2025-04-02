import { DropRect } from './interfaces';
import {
  DivideParentNode,
  DivideContentNode,
  TreeState,
  Orientation,
  DivideNode,
} from './layoutAdapter';


export function createContentNode<T>(
  props: Partial<DivideContentNode<T>> & Pick<DivideContentNode<T>, 'data'>,
  state?: TreeState<T>,
) {
  const node: DivideContentNode<T> = {
    id: uuid(),
    type: 'content',
    grow: 1,
    ...props,
  };

  if (state) {
    state.nodes[node.id] = node;
    state.ids.push(node.id);
  }

  return node;
}

export function createParentNode<T>(
  props: Partial<DivideParentNode>,
  state?: TreeState<T>,
) {
  const node: DivideParentNode = {
    id: uuid(),
    type: 'parent',
    direction: 'column',
    grow: 1,
    children: [],
    ...props,
  };

  if (state) {
    state.nodes[node.id] = node;
    state.ids.push(node.id);
  }

  return node;
}


export function findClosestAncestorWithAttribute(
  from: HTMLElement,
  to: HTMLElement,
  filter: (element: HTMLElement) => boolean,
) {
  let current: HTMLElement | null = from;

  while (current && current !== to) {
    if (filter(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

export type DividerState = {
  id: string;
  before: string;
  after: string;
  orientation: Orientation;
  left: number;
  right: number;
  top: number;
  bottom: number;
  lower: number;
  upper: number;
};

export function recursiveMeasure<T>(state: TreeState<T>) {
  const measurements: Record<
    string,
    { left: number; right: number; top: number; bottom: number }
  > = {};

  const dividers: DividerState[] = [];

  if (!state.root) {
    return {
      measurements,
      dividers,
    };
  }



  const recursiveMeasure = (
    id: string,
    inset: { left: number; right: number; top: number; bottom: number },
  ) => {
    const node = state.nodes[id];

    if (node.type === 'content') {
      measurements[id] = {
        left: inset.left,
        right: inset.right,
        top: inset.top,
        bottom: inset.bottom,
      };
    } else if (node.type === 'parent') {
      const totalGrow = node.children.reduce(
        (sum, childId) => sum + state.nodes[childId].grow,
        0,
      );
      const size =
        node.direction === 'row'
          ? 100 - (inset.right + inset.left)
          : 100 - (inset.bottom + inset.top);
      let growSum = 0;

      let lastChildId: string | null = null;
      let lastLower: number | null = null;

      node.children.forEach((childId) => {
        const childNode = state.nodes[childId];
        const growAmount = childNode.grow / totalGrow;

        if (node.direction === 'row') {
          const x1 = inset.left + growSum * size;
          const x2 = x1 + growAmount * size;

          recursiveMeasure(childId, {
            left: x1,
            right: 100 - x2,
            top: inset.top,
            bottom: inset.bottom,
          });

          if (lastChildId !== null && lastLower !== null) {
            dividers.push({
              id: uuid(),
              before: lastChildId,
              after: childId,
              orientation: 'vertical',
              left: x1,
              right: x1,
              top: inset.top,
              bottom: inset.bottom,
              lower: lastLower,
              upper: x2,
            });
          }

          lastLower = x1;
        } else {
          const y1 = inset.top + growSum * size;
          const y2 = y1 + growAmount * size;

          recursiveMeasure(childId, {
            left: inset.left,
            right: inset.right,
            top: y1,
            bottom: 100 - y2,
          });

          if (lastChildId !== null && lastLower !== null) {
            dividers.push({
              id: uuid(),
              before: lastChildId,
              after: childId,
              orientation: 'horizontal',
              left: inset.left,
              right: inset.right,
              top: y1,
              bottom: y1,
              lower: lastLower,
              upper: y2,
            });
          }

          lastLower = y1;
        }

        growSum += growAmount;
        lastChildId = childId;
      });

      measurements[id] = {
        left: inset.left,
        right: inset.right,
        top: inset.top,
        bottom: inset.bottom,
      };
    }
  };

  recursiveMeasure(state.root, {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  return {
    measurements,
    dividers,
  };
}


export function clamp(number: number, lower: number, upper: number) {
  return Math.min(Math.max(number, lower), upper);
}

export function uuid() {
  return "id" + Math.random().toString(16).slice(2)
}


export function measureNodes<T>(
  state: TreeState<T>,
  parentInlineSize: number,
  parentBlockSize: number,
  measurements: Record<
    string,
    { left: number; right: number; top: number; bottom: number }
  > = {},
  parent: DivideNode<T> | undefined,
  current: DivideNode<T>,
  level: number,
  inset?: { left: number; right: number; top: number; bottom: number },
): DropRect[] {
  if (level > 2) {
    return [];
  }

  const W = 20;

  const measurement = measurements[current.id];
  const domRect = {
    left: parentInlineSize * (measurement.left / 100),
    right: parentInlineSize * ((100 - measurement.right) / 100),
    top: parentBlockSize * (measurement.top / 100),
    bottom: parentBlockSize * ((100 - measurement.bottom) / 100),
  };

  if (!inset) {
    inset = {
      left: domRect.left,
      right: domRect.right,
      top: domRect.top,
      bottom: domRect.bottom,
    };
  } else {
    inset = {
      left: Math.max(inset.left, domRect.left),
      right: Math.min(inset.right, domRect.right),
      top: Math.max(inset.top, domRect.top),
      bottom: Math.min(inset.bottom, domRect.bottom),
    };
  }

  const rects: DropRect[] = [];

  const leftRect = {
    left: inset.left,
    top: inset.top + W,
    bottom: inset.bottom - W,
    right: inset.left + W,

    visible: {
      left: inset.left,
      right: (inset.left + inset.right) / 2,
      top: inset.top,
      bottom: inset.bottom,
    },

    action: {
      type: 'insert',
      position: 'left',
      node: current,
    },
  } as DropRect;

  const rightRect = {
    left: inset.right - W,
    top: inset.top + W,
    bottom: inset.bottom - W,
    right: inset.right,

    visible: {
      left: (inset.left + inset.right) / 2,
      right: inset.right,
      top: inset.top,
      bottom: inset.bottom,
    },

    action: {
      type: 'insert',
      position: 'right',
      node: current,
    },
  } as DropRect;

  const topRect = {
    left: inset.left + W,
    top: inset.top,
    right: inset.right - W,
    bottom: inset.top + W,

    visible: {
      left: domRect.left,
      right: domRect.right,
      top: domRect.top,
      bottom: (inset.top + inset.bottom) / 2,
    },

    action: {
      type: 'insert',
      position: 'top',
      node: current,
    },
  } as DropRect;

  const bottomRect = {
    left: inset.left + W,
    top: inset.bottom - W,
    right: inset.right - W,
    bottom: inset.bottom,

    visible: {
      left: domRect.left,
      right: domRect.right,
      top: (inset.top + inset.bottom) / 2,
      bottom: domRect.bottom,
    },

    action: {
      type: 'insert',
      position: 'bottom',
      node: current,
    },
  } as DropRect;

  if (!(parent?.type === 'parent' && parent.direction === 'row')) {
    rects.push(leftRect, rightRect);

    inset.left = leftRect.right;
    inset.right = rightRect.left;
  }
  if (!(parent?.type === 'parent' && parent.direction === 'column')) {
    rects.push(topRect, bottomRect);

    inset.top = topRect.bottom;
    inset.bottom = bottomRect.top;
  }

  // If children only have 1 child, skip one hierarchy level
  if (current.type === 'parent') {
    current.children.forEach((child) => {
      rects.push(
        ...measureNodes(
          state,
          parentInlineSize,
          parentBlockSize,
          measurements,
          current,
          state.nodes[child],
          level + 1,
          inset,
        ),
      );
    });
  }

  return rects;
}