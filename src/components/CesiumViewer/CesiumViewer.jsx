import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Viewer, Color, ScreenSpaceEventType, JulianDate, Cartesian3, HeadingPitchRange, Matrix4 } from "cesium";
import { createSceneController } from "../../utils/sceneController.js";
import { configureImagery, flatTerrain, loadTerrain } from "../../utils/mapEnvironment.js";
import { flyCamera, initializeCamera, orbitCamera, cameraTarget } from "../../utils/cameraUtils.js";
import { reducedMotion } from "../../utils/visualizationUtils.js";
import { useTranslation } from "../../i18n/useTranslation.js";
export default forwardRef(function CesiumViewer({
  data,
  state,
  onSelect,
  onEnvironment,
  onManualCamera,
  onBasicMode
}, ref) {
  const { t } = useTranslation();
  const container = useRef(null),
    viewerRef = useRef(null),
    controllerRef = useRef(null),
    stateRef = useRef(state),
    callbacks = useRef({
      onSelect,
      onEnvironment,
      onManualCamera
    });
  const terrainCache = useRef(null),
    terrainRequest = useRef(0),
    terrainEnabled = useRef(false);
  const [restart, setRestart] = useState(0);
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  stateRef.current = state;
  callbacks.current = {
    onSelect,
    onEnvironment,
    onManualCamera
  };
  useImperativeHandle(ref, () => ({
    fly(mode, nextState) {
      if (viewerRef.current) flyCamera(viewerRef.current, mode, data, nextState ?? stateRef.current, controllerRef.current?.ground);
    },
    zoom(direction) {
      callbacks.current.onManualCamera?.();
      const v = viewerRef.current;
      if (v) {
        const datum = controllerRef.current?.ground[stateRef.current.selectedParcel?.parcelId ?? 'PARCEL-001']?.base ?? 0;
        v.camera[direction > 0 ? "zoomIn" : "zoomOut"](Math.max(4, Math.abs(v.camera.positionCartographic.height - datum) * 0.18));
        v.scene.requestRender();
      }
    },
    orbit(direction) {
      callbacks.current.onManualCamera?.();
      orbitCamera(viewerRef.current, data, stateRef.current, controllerRef.current?.ground ?? {}, direction);
    }
  }), [data]);
  useEffect(() => {
    let alive = true,
      removeImagery = () => {},
      removeRenderError = () => {},
      healthCheck = 0,
      flight = 0;
    let viewer, controller;
    setReady(false);
    setError("");
    try {
      viewer = new Viewer(container.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayer: false,
        terrainProvider: flatTerrain(),
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        shouldAnimate: false,
        showRenderLoopErrors: false,
        shadows: false,
        msaaSamples: 2,
        contextOptions: {
          webgl: {
            alpha: false,
            preserveDrawingBuffer: false
          }
        }
      });
      viewerRef.current = viewer;
      const reportStopped = (scene, cause) => {
        if (!alive) return;
        clearInterval(healthCheck);
        clearTimeout(flight);
        viewer.useDefaultRenderLoop = false;
        callbacks.current.onManualCamera?.();
        setError(t("The 3D renderer stopped. Restart in basic 3D to inspect parcels, buildings, floors and units, or reload to retry detailed models."));
        console.error("Cesium rendering stopped", cause ?? "The render loop stopped during a model update.");
      };
      removeRenderError = viewer.scene.renderError.addEventListener(reportStopped);
      // DataSourceDisplay failures occur before scene.renderError. Watch the
      // public loop flag too, so a stopped canvas never silently looks usable.
      healthCheck = setInterval(() => {
        if (alive && !viewer.isDestroyed() && !viewer.useDefaultRenderLoop) reportStopped();
      }, 500);
      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.6);
      viewer.scene.globe.baseColor = Color.fromCssColorString("#6f8779");
      viewer.scene.backgroundColor = Color.fromCssColorString("#8cb9d6");
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.globe.enableLighting = false;
      viewer.scene.fog.enabled = true;
      viewer.scene.postProcessStages.fxaa.enabled = true;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 8;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000;
      viewer.clock.currentTime = JulianDate.fromIso8601("2026-06-15T07:00:00Z");
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      controller = createSceneController(viewer, data, metadata => callbacks.current.onSelect(metadata));
      controllerRef.current = controller;
      controller.sync(stateRef.current);
      initializeCamera(viewer, data);
      flight = setTimeout(() => {
        if (alive) flyCamera(viewer, "3d", data, stateRef.current, {}, 1.15);
      }, 180);
      configureImagery(viewer, {
        token: import.meta.env.VITE_CESIUM_ION_TOKEN?.trim(),
        offline: import.meta.env.VITE_OFFLINE_MODE === "true",
        isAlive: () => alive,
        onStatus: status => {
          if (alive) {
            controller.setSchematic(status.startsWith("Schematic"));
            callbacks.current.onEnvironment({
              imagery: status
            });
          }
        }
      }).then(remove => {
        if (alive) removeImagery = remove;else remove();
      }).catch(() => {
        if (alive) {
          controller.setSchematic(true);
          callbacks.current.onEnvironment({
            imagery: t("Schematic ground · imagery unavailable")
          });
        }
      });
      setReady(true);
    } catch (err) {
      setError(t("The 3D scene could not start. Enable WebGL and hardware acceleration in your browser, then reload."));
      console.error("Cesium initialization failed", err);
      controller?.destroy();
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      controllerRef.current = null;
      alive = false;
      clearTimeout(flight);
      clearInterval(healthCheck);
      removeRenderError();
    }
    return () => {
      alive = false;
      clearTimeout(flight);
      clearInterval(healthCheck);
      removeRenderError();
      terrainRequest.current++;
      removeImagery();
      if (viewer && !viewer.isDestroyed()) {
        controller?.destroy();
        viewer.destroy();
      }
      viewerRef.current = null;
      controllerRef.current = null;
    };
  }, [data, restart]);
  useEffect(() => {
    controllerRef.current?.sync(state);
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      for (let i = 0; i < viewer.imageryLayers.length; i++) viewer.imageryLayers.get(i).show = state.layerVisibility.imagery !== false;
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = state.cameraMode !== 'underground';
      viewer.shadows = state.layerVisibility.shadows === true;
    }
  }, [state, ready, restart]);
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    const viewer = viewerRef.current,
      controller = controllerRef.current,
      request = ++terrainRequest.current;
    const enabled = state.layerVisibility.terrain;
    const token = import.meta.env.VITE_CESIUM_ION_TOKEN?.trim();
    if (!enabled || !token || import.meta.env.VITE_OFFLINE_MODE === "true") {
      const wasTerrain = terrainEnabled.current;
      terrainEnabled.current = false;
      viewer.terrainProvider = flatTerrain();
      controller.setGround({});
      callbacks.current.onEnvironment({
        terrain: !enabled ? t("Flat ground") : import.meta.env.VITE_OFFLINE_MODE === "true" ? t("Flat ground · offline") : t("Flat ground · no ion token")
      });
      if (wasTerrain) flyCamera(viewer, stateRef.current.cameraMode, data, stateRef.current, {});
      return;
    }
    callbacks.current.onEnvironment({
      terrain: t("Loading terrain…")
    });
    (async () => {
      try {
        const loaded = terrainCache.current ?? (await loadTerrain(data));
        terrainCache.current = loaded;
        if (request !== terrainRequest.current || viewer.isDestroyed()) return;
        controller.setGround(loaded.ground);
        viewer.terrainProvider = loaded.provider;
        terrainEnabled.current = true;
        callbacks.current.onEnvironment({
          terrain: t("World Terrain · enabled")
        });
        flyCamera(viewer, stateRef.current.cameraMode, data, stateRef.current, loaded.ground);
      } catch {
        if (request !== terrainRequest.current || viewer.isDestroyed()) return;
        viewer.terrainProvider = flatTerrain();
        controller.setGround({});
        terrainEnabled.current = false;
        callbacks.current.onEnvironment({
          terrain: t("Flat ground · terrain unavailable")
        });
      }
    })();
  }, [ready, restart, state.layerVisibility.terrain, data]);
  useEffect(() => {
    const viewer=viewerRef.current;
    if(!ready || !viewer || !state.autoRotate || reducedMotion()) return;
    const canvas=viewer.scene.canvas;
    const t=cameraTarget(stateRef.current.cameraMode,data,stateRef.current,controllerRef.current?.ground);
    const target=Cartesian3.fromDegrees(...t.center,t.elevation);
    const distance=Cartesian3.distance(viewer.camera.positionWC,target),pitch=Math.min(-.12,viewer.camera.pitch);
    let heading=viewer.camera.heading,frame=0,last=performance.now(),stopped=false;
    viewer.camera.cancelFlight();
    const stop=()=>{stopped=true;cancelAnimationFrame(frame);callbacks.current.onManualCamera?.();};
    const tick=now=>{
      if(stopped || viewer.isDestroyed()) return;
      heading+=Math.min(now-last,40)*.00009;last=now;
      viewer.camera.lookAt(target,new HeadingPitchRange(heading,pitch,distance));
      viewer.camera.lookAtTransform(Matrix4.IDENTITY);viewer.scene.requestRender();
      frame=requestAnimationFrame(tick);
    };
    canvas.addEventListener('pointerdown',stop);
    canvas.addEventListener('wheel',stop,{passive:true});
    frame=requestAnimationFrame(tick);
    return()=>{stopped=true;cancelAnimationFrame(frame);canvas.removeEventListener('pointerdown',stop);canvas.removeEventListener('wheel',stop);};
  },[ready,restart,state.autoRotate,data]);
  return <>
      <div ref={container} className="cesium-host" aria-label={t("Interactive 3D cadastral map")} />
      {!ready && !error && <div className="scene-loading">
          <span className="loading-ring" />
          {t("Preparing Bengaluru demo zone…")}
        </div>}
      {error && <div className="scene-error" role="alert">
          <strong>{t("3D rendering unavailable")}</strong>
          <p>{error}</p>
          <button onClick={() => { onBasicMode?.(); setRestart(value => value + 1); }}>{t("Restart in basic 3D")}</button>
          <button onClick={() => window.location.reload()}>{t("Reload scene")}</button>
        </div>}
    </>;
});
