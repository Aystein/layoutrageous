import { DivideInstance } from './useReactDivide';
import { flushSync } from 'react-dom';
import { clamp, DividerState } from './util';
import { useInteractions } from './useInteractions';
import { useShallowState } from './useShallowState';
import { ReactDivideProps } from './Dock';

export function Divider<T>({
  value: { before, after, orientation, left, right, top, bottom, lower, upper },
  instance,
  boundingClientRect,
  classNames,
}: {
  value: DividerState;
  instance: DivideInstance<T>;
  boundingClientRect?: DOMRectReadOnly;
  classNames: ReactDivideProps<T>['dividerClassNames'];
}) {
  const [dragState, setDragState] = useShallowState({
    isDragging: false,
    placeholderSize: 0,
    bounds: null as DOMRect | null,
    translation: { x: 0, y: 0 },
    startX: 0,
    startY: 0,
  });

  const { ref, setRef } = useInteractions({
    minimumDragDistance: 0,
    shouldSkip: (event) => {
      return event.nativeEvent.button !== 0;
    },
    onDrag: (event) => {
      if (!boundingClientRect) {
        return;
      }

      const parentInlineSize = boundingClientRect.width;
      const parentBlockSize = boundingClientRect.height;

      const { clientX, clientY } = event.nativeEvent;
      const offsetX = clientX - boundingClientRect.x;
      const offsetY = clientY - boundingClientRect.y;

      const lowerBoundary =
        orientation === 'vertical'
          ? (lower / 100) * parentInlineSize
          : (lower / 100) * parentBlockSize;

      const upperBoundary =
        orientation === 'vertical'
          ? (upper / 100) * parentInlineSize
          : (upper / 100) * parentBlockSize;

      if (event.index === 0) {
        const dividerDom = (
          event.nativeEvent.target as HTMLElement
        ).getBoundingClientRect();

        const placeholderSize =
          orientation === 'vertical' ? dividerDom.width : dividerDom.height;

        flushSync(() => {
          setDragState({
            isDragging: true,
            placeholderSize,
            bounds: ref.current!.getBoundingClientRect(),
            translation: {
              x: 0,
              y: 0,
            },
            startX: offsetX,
            startY: offsetY,
          });
        });
      } else if (event.index === -1) {
        const treeState = instance.getState();
        const beforeNode = treeState.nodes[before];
        const afterNode = treeState.nodes[after];

        if (afterNode && beforeNode) {
          // Get total grow
          const totalGrow = beforeNode.grow + afterNode.grow;

          const dividerMiddle =
            orientation === 'vertical'
              ? clamp(offsetX, lowerBoundary + 100, upperBoundary - 100)
              : clamp(offsetY, lowerBoundary + 100, upperBoundary - 100);

          const leftWidth = dividerMiddle - lowerBoundary;
          const rightWidth = upperBoundary - dividerMiddle;

          const totalWidth = leftWidth + rightWidth;

          // Calculate new grow
          const newBeforeGrow = (leftWidth / totalWidth) * totalGrow;
          const newAfterGrow = (rightWidth / totalWidth) * totalGrow;

          instance.updateGrowthValues({
            [before]: newBeforeGrow,
            [after]: newAfterGrow,
          });
        }

        setDragState({
          isDragging: false,
          placeholderSize: 0,
        });
      } else {
        if (orientation === 'vertical') {
          const newX = clamp(offsetX, lowerBoundary + 100, upperBoundary - 100);

          setDragState({
            translation: {
              x: newX - dragState.startX,
              y: 0,
            },
          });
        } else {
          const newY = clamp(offsetY, lowerBoundary + 100, upperBoundary - 100);

          setDragState({
            translation: {
              x: 0,
              y: newY - dragState.startY,
            },
          });
        }
      }
    },
  });
  console.log("test")
  return (
    <>
      <div
        data-orientation={orientation}
        className={`layoutrageous-Divider-root ${classNames?.root ?? ''}`}
        style={{
          ...(dragState.isDragging
            ? {
                transform: `translate(${dragState.translation.x}px, ${dragState.translation.y}px)`,
              }
            : {}),
          left: `${left}%`,
          right: `${right}%`,
          top: `${top}%`,
          bottom: `${bottom}%`,
        }}
        ref={setRef}
      >
        <div className={`layoutrageous-Divider-inner ${classNames?.inner ?? ''}`} />
      </div>
    </>
  );
}
