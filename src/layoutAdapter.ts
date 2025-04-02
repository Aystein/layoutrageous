import { createContentNode, createParentNode, recursiveMeasure } from "./util";

export type Orientation = "horizontal" | "vertical";

export type ReactDivideDirection = "row" | "column";

export type DivideBaseNode = {
  id: string;
  type: "parent" | "content";
  grow: number;
  parent?: string;
  minSize?: number;
};

export type DivideContentNode<T> = DivideBaseNode & {
  type: "content";
  data: T;
};

export type DivideParentNode = DivideBaseNode & {
  type: "parent";
  direction: ReactDivideDirection;
  children: string[];
};

export type DivideNode<T> = DivideContentNode<T> | DivideParentNode;

export type TreeState<Data> = {
  // A list of all node ids
  ids: string[];

  // A map of all nodes
  nodes: Record<string, DivideNode<Data>>;

  // The id of the root node
  root?: string;
};

export function updateGrowthValues<Data>(
  state: TreeState<Data>,
  values: Record<string, number>
) {
  Object.keys(values).forEach((id) => {
    state.nodes[id].grow = values[id];
  });
}

/**
 * Repairs tree if there are degenerate nodes, which
 * is the case when there is a container with 1 child
 * or a container with a child that has the same direction
 * as the container
 */
export function repairDegenerateTree<Data>(state: TreeState<Data>) {
  if (!state.root) {
    return;
  }

  const recursiveRepair = (node: DivideNode<Data>) => {
    // First case
    if (node.type === "parent" && node.children.length === 1) {
      // Case when there is only one child
      const child = state.nodes[node.children[0]];
      const parent = state.nodes[node.parent!] as DivideParentNode;

      if (parent) {
        const index = parent.children.indexOf(node.id);
        parent.children[index] = child.id;
        child.parent = parent.id;
      } else {
        // If the parent is root, we need to update the root
        state.root = child.id;
        child.parent = undefined;
      }

      delete state.nodes[node.id];

      // Then call repair again
      recursiveRepair(state.nodes[child.id]);
    }

    if (node.type === "parent" && node.children.length > 1) {
      const direction = node.direction;

      // If children are parents and have the same direction, we can merge them
      const children = node.children.map((child) => state.nodes[child]);

      if (
        children.find(
          (child) =>
            child.type === "parent" &&
            (child as DivideParentNode).direction === direction
        )
      ) {
        // We have a child that is a parent and has the same direction
        const newChildren = children
          .map((child) => {
            if (
              child.type === "parent" &&
              (child as DivideParentNode).direction === direction
            ) {
              // Remove node
              delete state.nodes[child.id];

              return (child as DivideParentNode).children;
            } else {
              return child.id;
            }
          })
          .flat();

        node.children = newChildren;
        newChildren.forEach((child) => {
          state.nodes[child].parent = node.id;
        });
      }

      // Call repair on all children
      node.children.forEach((child) => recursiveRepair(state.nodes[child]));
    }
  };

  recursiveRepair(state.nodes[state.root!]);

  // Reset ids to match the nodes
  state.ids = Object.keys(state.nodes);
}

export function sortIds<Data>(state: TreeState<Data>) {
  state.ids.sort((a, b) => a.localeCompare(b));
}

export function visit<Data>(
  state: TreeState<Data>,
  visitor: (
    parent: DivideParentNode | undefined,
    node: DivideNode<Data>
  ) => void
) {
  if (!state.root) {
    return;
  }

  const recursiveVisit = (
    parent: DivideParentNode | undefined,
    node: DivideNode<Data>
  ) => {
    visitor(parent, node);

    if (node.type === "parent") {
      node.children.forEach((child) =>
        recursiveVisit(node, state.nodes[child])
      );
    }
  };

  recursiveVisit(undefined, state.nodes[state.root]);
}

export function addBestFitting<Data = unknown>(
  state: TreeState<Data>,
  data: Data,
  boxSize: { inlineSize: number; blockSize: number } = {
    inlineSize: 1000,
    blockSize: 1000,
  }
) {
  const measurements = recursiveMeasure(state);

  if (!state.root) {
    const newNode = createContentNode({
      data,
    });
    // Case when there is no root -> new node becomes the root
    state.ids.push(newNode.id);
    state.nodes[newNode.id] = newNode;
    state.root = newNode.id;
  } else {
    let max = 0;
    let direction: "column" | "row" = "column";
    let largestNode: DivideNode<Data> | undefined;

    visit(state, (parent, node) => {
      const measurement = measurements.measurements[node.id];

      if (node.type === "content" && measurement) {
        const width =
          (100 - measurement.left - measurement.right) * boxSize.inlineSize;
        const height =
          (100 - measurement.top - measurement.bottom) * boxSize.blockSize;

        if (width * height > max) {
          max = width * height;
          largestNode = node;
          direction = width > height ? "row" : "column";
        }
      }
    });

    if (largestNode?.type === "content") {
      const newNode = createContentNode({ data }, state);

      // Relink parent
      if (largestNode.parent) {
        const parent = state.nodes[largestNode.parent] as DivideParentNode;

        if (parent.direction === direction) {
          // The parent container has the same direction we are trying to split, we can just add it to the children
          parent.children.push(newNode.id);
          newNode.parent = parent.id;
        } else {
          // Different direction, we need to create a new parent container
          const replacementNode = createParentNode(
            {
              direction,
              grow: largestNode.grow,
              children: [largestNode.id, newNode.id],
            },
            state
          );

          const index = parent.children.indexOf(largestNode.id);
          parent.children[index] = replacementNode.id;
          replacementNode.parent = parent.id;

          // New parent of found node is the one we replace
          largestNode.parent = replacementNode.id;
          newNode.parent = replacementNode.id;
        }
      } else {
        const replacementNode = createParentNode(
          {
            direction,
            children: [largestNode.id, newNode.id],
          },
          state
        );

        // Largest found node was root
        state.root = replacementNode.id;

        largestNode.parent = replacementNode.id;
        newNode.parent = replacementNode.id;
      }
    }
  }

  sortIds(state);
}

export function applyInsert<Data>(
  state: TreeState<Data>,
  toMove: string,
  target: string,
  direction: "left" | "right" | "top" | "bottom"
) {
  const toMoveNode = state.nodes[toMove];
  const targetNode = state.nodes[target];

  // Remove node that we want to move
  deleteTile(state, toMove);

  // Readd toMove
  state.ids.push(toMove);
  state.nodes[toMove] = toMoveNode;

  if (targetNode.type === "content") {
    // Target is a content node, so we need to create a new parent node
    const replacementNode = createParentNode(
      {
        direction:
          direction === "left" || direction === "right" ? "row" : "column",
        grow: targetNode.grow,
        children: direction === "left" ? [toMove, target] : [target, toMove],
      },
      state
    );

    if (targetNode.parent) {
      const parent = state.nodes[targetNode.parent] as DivideParentNode;
      const index = parent.children.indexOf(target);
      parent.children[index] = replacementNode.id;
      replacementNode.parent = parent.id;
    } else {
      state.root = replacementNode.id;
    }

    toMoveNode.parent = replacementNode.id;
    targetNode.parent = replacementNode.id;
  } else if (targetNode.type === "parent") {
    if (
      targetNode.direction === "row" &&
      (direction === "left" || direction === "right")
    ) {
      if (direction === "left") {
        targetNode.children = [toMove, ...targetNode.children];
      }
      if (direction === "right") {
        targetNode.children = [...targetNode.children, toMove];
      }
      toMoveNode.parent = target;
    } else if (
      targetNode.direction === "column" &&
      (direction === "top" || direction === "bottom")
    ) {
      if (direction === "top") {
        targetNode.children = [toMove, ...targetNode.children];
      }
      if (direction === "bottom") {
        targetNode.children = [...targetNode.children, toMove];
      }
      toMoveNode.parent = target;
    } else {
      const replacementNode = createParentNode(
        {
          direction:
            direction === "left" || direction === "right" ? "row" : "column",
          children:
            direction === "left" || direction === "top"
              ? [toMove, target]
              : [target, toMove],
        },
        state
      );

      toMoveNode.parent = replacementNode.id;
      targetNode.parent = replacementNode.id;

      state.root = replacementNode.id;
    }
  }

  sortIds(state);
}

export function deleteTile<Data>(state: TreeState<Data>, id: string) {
  const node = state.nodes[id];

  if (!node) {
    return;
  }

  if (!node.parent) {
    state.root = undefined;
    state.ids = [];
    state.nodes = {};
    return;
  } else if (node.type === "content") {
    const parent = state.nodes[node.parent] as DivideParentNode;
    const index = parent.children.indexOf(id);

    // Simplify tree
    if (parent.children.length === 2) {
      // Other node becomes this node
      if (parent.parent) {
        // Parent has a parent
        const grandParent = state.nodes[parent.parent] as DivideParentNode;
        const other = parent.children[index === 0 ? 1 : 0];

        const parentIndex = grandParent.children.indexOf(parent.id);
        grandParent.children[parentIndex] = other;
        state.nodes[other].parent = grandParent.id;
        state.nodes[other].grow = 1;

        delete state.nodes[parent.id];
      } else {
        // Parent is root, so the other child becomes the new root
        const newRoot = state.nodes[parent.children[index === 0 ? 1 : 0]];
        state.root = newRoot.id;
        newRoot.parent = undefined;

        delete state.nodes[parent.id];
      }
    } else {
      // Parent has 2 or more child
      const index = parent.children.indexOf(id);
      parent.children.splice(index, 1);
    }

    delete state.nodes[id];
    state.ids = Object.keys(state.nodes);
  }

  repairDegenerateTree(state);

  sortIds(state);
}

export function getInitialState<Data>(): TreeState<Data> {
  return {
    ids: [],
    nodes: {},
    root: undefined,
  };
}
