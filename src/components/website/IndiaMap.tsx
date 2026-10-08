"use client";

import { useEffect, useMemo, useState } from "react";
import type { FocusEvent, MouseEvent } from "react";

type IndiaMapProps = {
  presenceStates: string[];
};

type MapStateElement = SVGPathElement & {
  dataset: DOMStringMap & { state?: string };
};

function getMapState(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest<MapStateElement>("[data-state]");
}

export default function IndiaMap({ presenceStates }: IndiaMapProps) {
  const [svgSource, setSvgSource] = useState("");
  const [hoveredState, setHoveredState] = useState("");
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/assets/india-map.svg", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`India map request failed (${response.status}).`);
        return response.text();
      })
      .then(setSvgSource)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setMapError(error instanceof Error ? error.message : "Unable to load the India map.");
      });

    return () => controller.abort();
  }, []);

  const activeStates = useMemo(
    () => new Set(presenceStates.map((state) => state.toLowerCase())),
    [presenceStates],
  );

  const svgMarkup = useMemo(() => {
    if (!svgSource) return "";

    const decoratedSvg = svgSource
      .replace("<svg ", '<svg class="india-map-vector" role="group" aria-label="Interactive map of India" ')
      .replace(/<path\b[^>]*>/g, (pathTag) => {
        const stateName = pathTag.match(/\btitle="([^"]+)"/)?.[1];
        if (!stateName) return pathTag;

        const isActive = activeStates.has(stateName.toLowerCase());
        const fill = isActive ? "#2a9d8f" : "#e1e8e3";
        const accessibleName = `${stateName}${isActive ? ", Fluense Pharma presence" : ""}`;
        const coloredPath = pathTag.replace(/\sfill="[^"]*"/, ` fill="${fill}"`);

        return coloredPath.replace(
          /\s*\/?>$/,
          ` data-state="${stateName}" data-presence="${isActive}" tabindex="0" role="img" aria-label="${accessibleName}" />`,
        );
      });

    const goaMarker = activeStates.has("goa")
      ? '<g class="india-map-presence-marker" aria-hidden="true"><circle cx="152.26" cy="567.4" r="13" fill="#f7f8f5" stroke="#102a43" stroke-width="2"/><circle cx="152.26" cy="567.4" r="5" fill="#2a9d8f"/></g>'
      : "";
    return decoratedSvg.replace("</svg>", `${goaMarker}</svg>`);
  }, [activeStates, svgSource]);

  const handlePointer = (event: MouseEvent<HTMLDivElement>) => {
    setHoveredState(getMapState(event.target)?.dataset.state ?? "");
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    setHoveredState(getMapState(event.target)?.dataset.state ?? "");
  };

  return (
    <div className="india-map-shell">
      {svgMarkup ? (
        <div
          className="india-map-vector-wrap"
          onMouseOver={handlePointer}
          onMouseLeave={() => setHoveredState("")}
          onFocus={handleFocus}
          onBlur={() => setHoveredState("")}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      ) : mapError ? (
        <p className="india-map-status india-map-error" role="alert">
          The India map could not be loaded: {mapError}
        </p>
      ) : (
        <p className="india-map-status" role="status">Loading the India map…</p>
      )}
      <p className="india-map-caption" role="status" aria-live="polite">
        {hoveredState
          ? `${hoveredState}${activeStates.has(hoveredState.toLowerCase()) ? " · Fluense Pharma presence" : ""}`
          : `${presenceStates.join(" · ")} highlighted`}
      </p>
    </div>
  );
}
