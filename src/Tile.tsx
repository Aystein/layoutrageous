import { DropRect, Pos } from './interfaces';
import React from 'react';
import { LayoutInstance } from './useLayout';
import {
  deleteTile,
  DivideContentNode,
} from './layoutAdapter';
import { findClosestAncestorWithAttribute, measureNodes } from './util';
import { useInteractions } from './useInteractions';
import { useShallowState } from './useShallowState';
import { ReactDivideProps } from './Dock';

const ANIMATION_DURATION = 0.35;

export function Tile<T>({
  instance,
  node,
  inset,
  parentInlineSize,
  parentBlockSize,
  onDragStart,
  onDragEnd,
  measurements,
  classNames,
  renderTile,
  renderHeader,
}: {
  instance: LayoutInstance<T>;
  node: DivideContentNode<T>;
  inset: { left: number; right: number; bottom: number; top: number };
  parentInlineSize: number;
  parentBlockSize: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  measurements: Record<
    string,
    { left: number; right: number; top: number; bottom: number }
  >;
  classNames: ReactDivideProps<T>['tileClassNames'];
  renderTile: ReactDivideProps<T>['renderTile'];
  renderHeader: ReactDivideProps<T>['renderHeader'];
}) {
  const state = instance.getState();

  const [rects, setRects] = React.useState<DropRect[]>([]);

  const [dragState, setDragState] = useShallowState({
    bounds: null as DOMRect | null,
    dragging: false,
    position: null as Pos | null,
    fadeOut: false,
    hoveredRect: -1,
    initialX: 0,
    initialY: 0,
    timeoutHandle: -1,
  });

  React.useLayoutEffect(() => {
    if (dragState.dragging) {
      // Clone tree
      const deepCopy = instance.getDeepCopy();

      deleteTile(deepCopy, node.id);

      setRects(
        measureNodes(
          deepCopy,
          parentInlineSize,
          parentBlockSize,
          measurements,
          undefined,
          deepCopy.nodes[deepCopy.root!],
          0,
        ),
      );
    } else {
      setRects([]);
    }
  }, [
    dragState.dragging,
    instance,
    measurements,
    node,
    parentBlockSize,
    parentInlineSize,
    state.nodes,
    state.root,
  ]);

  const { ref, setRef } = useInteractions({
    throttle: true,
    minimumDragDistance: 2,
    shouldSkip: (event) => {
      if (dragState.timeoutHandle !== -1) {
        return true;
      }

      const target = event.nativeEvent.target as HTMLElement;
      // filter out elements that do not have data-draggable attribute
      return (
        state.ids.length === 1 ||
        !findClosestAncestorWithAttribute(
          target,
          ref.current!,
          (element) => element.getAttribute('data-draggable') === 'true',
        )
      );
    },
    onDrag: (event) => {
      const bounds = ref.current!.getBoundingClientRect();

      if (event.index === 0) {
        setDragState({
          bounds,
          dragging: true,
          position: {
            x: event.movementX,
            y: event.movementY,
          },
          initialX: event.initialX,
          initialY: event.initialY,
        });

        onDragStart();
      } else if (event.index === -1) {
        if (~dragState.hoveredRect) {
          const rect = rects[dragState.hoveredRect];

          setDragState({
            dragging: false,
            fadeOut: false,
            position: {
              x: 0,
              y: 0,
            },
            hoveredRect: -1,
          });

          if (rect.action.type === 'insert') {
            instance.applyInsert(
              node.id,
              rect.action.node.id,
              rect.action.position,
            );
          }
        } else {
          setDragState({
            dragging: false,
            fadeOut: true,
            position: {
              x: 0,
              y: 0,
            },
            timeoutHandle: setTimeout(() => {
              setDragState({
                fadeOut: false,
                timeoutHandle: -1,
              });
            }, ANIMATION_DURATION * 1000),
          });
        }

        onDragEnd();
      } else {
        if (dragState.bounds) {
          setDragState({
            position: {
              x:
                event.nativeEvent.clientX -
                event.initialX -
                dragState.bounds.left,
              y:
                event.nativeEvent.clientY -
                event.initialY -
                dragState.bounds.top,
            },
          });
        }
      }
    },
  });

  let transition: Partial<React.CSSProperties> = {};
  let scale: number | undefined = 0.5;

  if (dragState.fadeOut) {
    scale = 1;
    transition = {
      transitionProperty:
        'translate, opacity, scale, outline-width, outline-color',
      transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
      transitionDuration: `${ANIMATION_DURATION}s`,
    };
  } else if (dragState.dragging && dragState.bounds) {
    scale = Math.min(
      1,
      250 / Math.max(dragState.bounds.width, dragState.bounds.height),
    );
  } else {
    scale = 1;
    // Smooth animation to new insets
    // transition = `left 0.3s cubic-bezier(0.2, 0, 0, 1), right 0.3s cubic-bezier(0.2, 0, 0, 1), top 0.3s cubic-bezier(0.2, 0, 0, 1), bottom 0.3s cubic-bezier(0.2, 0, 0, 1)`;
  }

  let style: Partial<React.CSSProperties> = {};
  if (dragState.dragging && dragState.position) {
    style = {
      left: dragState.bounds!.left,
      top: dragState.bounds!.top,
      width: dragState.bounds!.width,
      height: dragState.bounds!.height,
      transformOrigin: `${dragState.initialX}px ${dragState.initialY}px`,
      translate: `${-3 + dragState.position.x}px ${-3 + dragState.position.y}px`,
      scale,
      outlineWidth: 2 / scale,
      boxShadow: `rgb(165, 173, 186) ${4 / scale}px ${4 / scale}px ${2 / scale}px 0px`,
    };
  } else if (dragState.fadeOut && dragState.position) {
    style = {
      opacity: 1,
      background: 'white',
      position: 'fixed',
      left: dragState.bounds!.left,
      top: dragState.bounds!.top,
      width: dragState.bounds!.width,
      height: dragState.bounds!.height,
      transformOrigin: `${dragState.initialX}px ${dragState.initialY}px`,
      translate: `${-3 + dragState.position.x}px ${-3 + dragState.position.y}px`,
      scale,
      outlineWidth: 2 / scale,
      outlineColor: 'transparent',
      outlineStyle: 'solid',
      boxShadow: `transparent ${4 / scale}px ${4 / scale}px ${2 / scale}px 0px`,
      zIndex: 1000,
      ...transition,
    };
  } else {
    style = {
      left: `${inset.left}%`,
      right: `${inset.right}%`,
      top: `${inset.top}%`,
      bottom: `${inset.bottom}%`,
      ...transition,
    };
  }

  return (
    <>
      <div
        id={node.id}
        data-dragging={dragState.dragging}
        className={`layoutrageous-Tile-root ${classNames?.root ?? ''}`}
        style={{
          ...style,
          scale: style.scale?.toString(),
        }}
        ref={setRef}
      >
        <div className={`layoutrageous-Tile-header ${classNames?.header ?? ''}`}>
          {renderHeader(node)}
        </div>

        <div className={`layoutrageous-Tile-body ${classNames?.body ?? ''}`}>
          {renderTile(node)}
        </div>
      </div>

      {dragState.dragging ? (
        <>
          {rects?.map((rect) => (
            <div
              key={JSON.stringify(rect)}
              onMouseEnter={() => {
                setDragState({
                  hoveredRect: rects.indexOf(rect),
                });
              }}
              onMouseLeave={() => {
                setDragState({
                  hoveredRect: -1,
                });
              }}
              className="layoutrageous-Dropzone-root"
              style={{
                position: 'absolute',
                left: rect.left,
                top: rect.top,
                width: rect.right - rect.left,
                height: rect.bottom - rect.top,
              }}
            />
          ))}

          {/* animated rect with dashed border that transitions to the currently hovered rect */}
          {dragState.hoveredRect !== -1 ? (
            <div
              className="layoutrageous-Targetzone-root"
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                left: rects[dragState.hoveredRect].visible.left,
                top: rects[dragState.hoveredRect].visible.top,
                width:
                  rects[dragState.hoveredRect].visible.right -
                  rects[dragState.hoveredRect].visible.left,
                height:
                  rects[dragState.hoveredRect].visible.bottom -
                  rects[dragState.hoveredRect].visible.top,
                transitionProperty: 'left, top, width, height',
                transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
                transitionDuration: '0.2s',
              }}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
