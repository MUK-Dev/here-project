'use client';

import React, {
  useCallback,
  useState,
  WheelEvent,
  PointerEvent,
  useMemo,
  useEffect,
} from 'react';
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useOthersMapped,
  useSelf,
  useStorage,
} from '@liveblocks/react';
import { nanoid } from 'nanoid';
import Info from './info';
import Participants from './participants';
import Toolbar from './toolbar';
import {
  Camera,
  CanvasMode,
  CanvasState,
  Color,
  Layer,
  LayerType,
  Point,
  Side,
  XYWH,
} from '@/types/canvas';
import CursorsPresence from './cursors-presence';
import {
  colorToCss,
  connectionIdToColor,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayers,
  pointerEventToCanvasPoint,
  resizeBounds,
} from '@/lib/utils';
import { LiveObject } from '@liveblocks/client';
import LayerPreview from './layer-preview';
import SelectionBox from './selection-box';
import SelectionTools from './selection-tools';
import Path from './path';
import { useDisableScrollBounce } from '@/hooks/use-disable-scroll-bounce';
import { useDeleteLayers } from '@/hooks/use-delete-layers';

const MAX_LAYERS = 100;
const SELECTION_NET_THRESHOLD = 5;

interface CanvasProps {
  boardId: string;
}

const Canvas = ({ boardId }: CanvasProps) => {
  const layerIds = useStorage((root) => root.layerIds);
  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false); // To track if panning is active
  const [lastMousePosition, setLastMousePosition] = useState<Point | null>(
    null
  );
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });

  useDisableScrollBounce();
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note,
      position: Point
    ) => {
      const liveLayers = storage.get('layers');
      if (liveLayers.size >= MAX_LAYERS) {
        return;
      }

      const liveLayerIds = storage.get('layerIds');
      const layerId = nanoid();
      const layer = new LiveObject<Layer>({
        type: layerType,
        x: position.x,
        y: position.y,
        height: 100,
        width: 100,
        fill: lastUsedColor,
      });

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({
        mode: CanvasMode.None,
      });
    },
    [lastUsedColor]
  );

  const onWheel = useCallback((e: WheelEvent) => {
    console.log(e.deltaX, e.deltaY);
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      if (!layerIds) return;

      console.log('selection net');

      const layers = storage.get('layers').toImmutable();
      setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });

      const ids = findIntersectingLayersWithRectangle(
        layerIds,
        layers,
        origin,
        current
      );

      setMyPresence({ selection: ids }, { addToHistory: true });
    },
    [layerIds]
  );

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (
      Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) >
      SELECTION_NET_THRESHOLD
    ) {
      setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
    }
  }, []);

  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        pencilColor: lastUsedColor,
      });
    },
    [lastUsedColor]
  );

  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;

      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft == null
      )
        return;

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 &&
          pencilDraft[0][0] === point.x &&
          pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]],
      });
    },
    [canvasState.mode]
  );

  const insertPath = useMutation(
    ({ setMyPresence, storage, self }) => {
      const liveLayers = storage.get('layers');
      const { pencilDraft } = self.presence;

      if (
        pencilDraft == null ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
      ) {
        setMyPresence({ pencilDraft: null }, { addToHistory: true });
        return;
      }

      const id = nanoid();
      liveLayers.set(
        id,
        new LiveObject(penPointsToPathLayers(pencilDraft, lastUsedColor))
      );

      const liveLayerIds = storage.get('layerIds');
      liveLayerIds.push(id);

      setMyPresence({ pencilDraft: null });
      setCanvasState({ mode: CanvasMode.Pencil });
    },
    [lastUsedColor]
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) return;

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point
      );

      const liveLayers = storage.get('layers');
      const layer = liveLayers.get(self.presence.selection[0]);

      if (layer) {
        layer.update(bounds);
      }
    },
    [canvasState]
  );

  const translateSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) return;

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const liveLayers = storage.get('layers');
      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);

        if (layer) {
          layer.update({
            x: layer.get('x') + offset.x,
            y: layer.get('y') + offset.y,
          });
        }
      }

      setCanvasState({
        mode: CanvasMode.Translating,
        current: point,
      });
    },
    [canvasState]
  );

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: PointerEvent) => {
      e.preventDefault();
      const current = pointerEventToCanvasPoint(e, camera);
      setMyPresence({ cursor: current });

      //* Translate the selected layer
      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        //* Resize the selected layer
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }

      //* Pan the camera if the middle mouse button is down
      if (isPanning && lastMousePosition) {
        const dx = e.clientX - lastMousePosition.x;
        const dy = e.clientY - lastMousePosition.y;

        // Update the camera position by dragging
        setCamera((prevCamera) => ({
          x: prevCamera.x + dx,
          y: prevCamera.y + dy,
        }));

        // Update the last mouse position
        setLastMousePosition({ x: e.clientX, y: e.clientY });
      }
    },
    [
      isPanning,
      lastMousePosition,
      canvasState,
      resizeSelectedLayer,
      camera,
      translateSelectedLayer,
      updateSelectionNet,
      continueDrawing,
    ]
  );

  const onPointerLeave = useMutation(({ setMyPresence }, e: PointerEvent) => {
    e.preventDefault();
    setMyPresence({ cursor: null });
    setIsPanning(false);
    setLastMousePosition(null);
  }, []);

  const onPointerUp = useMutation(
    ({ setMyPresence }, e: PointerEvent) => {
      if (e.button === 1) {
        // Middle mouse button
        setIsPanning(false);
        setLastMousePosition(null);
        setCanvasState({ mode: CanvasMode.None });
      } else {
        const point = pointerEventToCanvasPoint(e, camera);
        if (
          canvasState.mode === CanvasMode.None ||
          canvasState.mode === CanvasMode.Pressing
        ) {
          unselectLayers();
          setCanvasState({ mode: CanvasMode.None });
        } else if (canvasState.mode === CanvasMode.Pencil) {
          insertPath();
        } else if (canvasState.mode === CanvasMode.Inserting) {
          insertLayer(canvasState.layerType, point);
        } else {
          setCanvasState({ mode: CanvasMode.None });
        }
        history.resume();
      }
    },
    [
      camera,
      canvasState,
      history,
      insertLayer,
      unselectLayers,
      insertPath,
      setCanvasState,
    ]
  );

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button === 1 && canvasState.mode === CanvasMode.None) {
        // Middle mouse button
        setIsPanning(true);
        setLastMousePosition({ x: e.clientX, y: e.clientY });
        e.preventDefault();
      }

      const point = pointerEventToCanvasPoint(e, camera);
      if (canvasState.mode === CanvasMode.Inserting) {
        return;
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState.mode, setCanvasState, startDrawing]
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      )
        return;

      history.pause();
      e.stopPropagation();

      const point = pointerEventToCanvasPoint(e, camera);

      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [setCanvasState, camera, history, canvasState.mode]
  );

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;

      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history]
  );

  const deleteLayers = useDeleteLayers();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'z': {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.redo();
            } else {
              history.undo();
            }
            break;
          }
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [deleteLayers, history]);

  return (
    <main
      className='h-full w-full relative bg-neutral-100 touch-none'
      style={{
        cursor: isPanning ? 'grabbing' : 'default',
      }}
    >
      <Info boardId={boardId} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={history.undo}
        redo={history.redo}
      />
      <SelectionTools camera={camera} setLastUsedColor={setLastUsedColor} />
      <svg
        className='h-[100vh] w-[100vw]'
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <defs>
          <pattern
            id='grid'
            width='60'
            height='60'
            patternUnits='userSpaceOnUse'
          >
            <path
              d='M 100 0 L 0 0 0 100'
              fill='none'
              stroke='lightgray'
              strokeDasharray={'5 5'}
              strokeWidth='1'
            />
          </pattern>
        </defs>
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px)`,
          }}
        >
          <rect
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill='url(#grid)'
          />
          {layerIds?.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}
          <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
          {canvasState.mode === CanvasMode.SelectionNet &&
            canvasState.current != null && (
              <rect
                className='fill-blue-500/5 stroke-blue-500 stroke-1'
                x={Math.min(canvasState.origin.x, canvasState.current?.x)}
                y={Math.min(canvasState.origin.y, canvasState.current?.y)}
                width={Math.abs(canvasState.origin.x - canvasState.current?.x)}
                height={Math.abs(canvasState.origin.y - canvasState.current?.y)}
              />
            )}
          <CursorsPresence />
          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorToCss(lastUsedColor)}
              x={0}
              y={0}
            />
          )}
        </g>
      </svg>
    </main>
  );
};

export default Canvas;
