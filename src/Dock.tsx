import { LayoutInstance } from './useLayout';
import React from 'react';
import { Tile } from './Tile';
import { deleteTile, DivideContentNode } from './layoutAdapter';
import { useResizeObserver } from './useResizeObserver';
import { recursiveMeasure } from './util';
import { produce } from 'immer';
import { Divider } from './Divider';

export type ReactDivideProps<T> = {
  instance: LayoutInstance<T>;
  dividerClassNames?: Partial<{
    root: string;
    inner: string;
  }>;
  tileClassNames?: Partial<{
    root: string;
    header: string;
    body: string;
  }>;
  renderTile: (state: DivideContentNode<T>) => React.ReactNode;
  renderHeader: (state: DivideContentNode<T>) => React.ReactNode;
};

export function Dock<T>({
  instance,
  dividerClassNames,
  tileClassNames,
  renderTile,
  renderHeader,
}: ReactDivideProps<T>) {
  const state = instance.getState();

  const { ref, setRef, inlineSize, blockSize } = useResizeObserver();

  const [dragging, setDragging] = React.useState<string | null>(null);

  const stableContentIds = React.useMemo(() => {
    return state.ids.filter((id) => state.nodes[id].type === 'content');
  }, [state.ids, state.nodes]);

  const { measurements, dividers } = React.useMemo(() => {
    if (dragging) {
      // Produce a new state with the dragging node removed
      const stateWithDragNodeRemoved = produce(state, (draft) => {
        deleteTile(draft, dragging);
      });

      return recursiveMeasure(stateWithDragNodeRemoved);
    }

    return recursiveMeasure(state);
  }, [dragging, state]);

  return (
    <div className="layoutrageous-Dock-root" ref={setRef}>
      {stableContentIds.map((id) => {
        const node = state.nodes[id] as DivideContentNode<T>;
        const measurement = measurements[id];

        return (
          <Tile
            key={id}
            instance={instance}
            onDragStart={() => {
              setDragging(id);
            }}
            onDragEnd={() => {
              setDragging(null);
            }}
            node={node}
            inset={measurement}
            parentInlineSize={inlineSize}
            parentBlockSize={blockSize}
            measurements={measurements}
            classNames={tileClassNames}
            renderTile={renderTile}
            renderHeader={renderHeader}
          />
        );
      })}

      {dividers.map((divider) => {
        return (
          <Divider
            instance={instance}
            key={divider.id}
            classNames={dividerClassNames}
            value={divider}
            boundingClientRect={ref.current?.getBoundingClientRect()}
          />
        );
      })}
    </div>
  );
}
