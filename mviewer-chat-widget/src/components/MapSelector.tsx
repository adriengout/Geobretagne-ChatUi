import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapSelector.css';

const MIN_ZOOM_TO_DRAW = 11;

export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

type Props = {
  onSelect: (bbox: BBox) => void;
  onClose: () => void;
};

export function MapSelector({ onSelect, onClose }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [zoom, setZoom] = useState(6);
  const [drawing, setDrawing] = useState(false);
  const [firstPoint, setFirstPoint] = useState<L.LatLng | null>(null);
  const rectRef = useRef<L.Rectangle | null>(null);
  const firstMarkerRef = useRef<L.CircleMarker | null>(null);

  const canDraw = zoom >= MIN_ZOOM_TO_DRAW;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [48.1, -2.0],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on('zoomend', () => setZoom(map.getZoom()));
    setZoom(map.getZoom());
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Met à jour le curseur et active/désactive le drag selon l'état
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();

    if (!canDraw) {
      container.style.cursor = 'default';
      map.dragging.enable();
      return;
    }

    if (drawing) {
      container.style.cursor = firstPoint ? 'crosshair' : 'crosshair';
    } else {
      container.style.cursor = 'crosshair';
    }
  }, [canDraw, drawing, firstPoint]);

  // Gestion des clics pour dessiner le rectangle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!canDraw) return;

      if (!firstPoint) {
        // Premier clic : pose le premier coin
        setFirstPoint(e.latlng);
        setDrawing(true);

        if (firstMarkerRef.current) firstMarkerRef.current.remove();
        firstMarkerRef.current = L.circleMarker(e.latlng, {
          radius: 5,
          color: '#1e3a5f',
          fillColor: '#1e3a5f',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
      } else {
        // Deuxième clic : confirme le bbox
        const bounds = L.latLngBounds(firstPoint, e.latlng);
        if (rectRef.current) rectRef.current.remove();
        if (firstMarkerRef.current) firstMarkerRef.current.remove();

        const bbox: BBox = {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        };

        setFirstPoint(null);
        setDrawing(false);
        onSelect(bbox);
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!firstPoint || !canDraw) return;
      const bounds = L.latLngBounds(firstPoint, e.latlng);
      if (rectRef.current) {
        rectRef.current.setBounds(bounds);
      } else {
        rectRef.current = L.rectangle(bounds, {
          color: '#1e3a5f',
          weight: 2,
          fillColor: '#4a7ec7',
          fillOpacity: 0.2,
          dashArray: '6 4',
        }).addTo(map);
      }
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMouseMove);
    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMouseMove);
    };
  }, [canDraw, firstPoint, onSelect]);

  const handleCancel = () => {
    if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
    if (firstMarkerRef.current) { firstMarkerRef.current.remove(); firstMarkerRef.current = null; }
    setFirstPoint(null);
    setDrawing(false);
    onClose();
  };

  const handleReset = () => {
    if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
    if (firstMarkerRef.current) { firstMarkerRef.current.remove(); firstMarkerRef.current = null; }
    setFirstPoint(null);
    setDrawing(false);
  };

  return (
    <div className="map-selector-overlay" role="dialog" aria-modal="true" aria-label="Sélectionner une zone">
      <div className="map-selector">
        <div className="map-selector__header">
          <span className="map-selector__title">Sélectionner une zone d'intérêt</span>
          <button type="button" className="map-selector__close" onClick={handleCancel} aria-label="Fermer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="map-selector__status-bar">
          {!canDraw ? (
            <span className="map-selector__status map-selector__status--warning">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1L12 11.5H1L6.5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M6.5 5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="6.5" cy="9.5" r="0.6" fill="currentColor"/>
              </svg>
              Zoomez davantage pour activer la sélection (zoom actuel : {zoom}, requis : {MIN_ZOOM_TO_DRAW})
            </span>
          ) : drawing && firstPoint ? (
            <span className="map-selector__status map-selector__status--active">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 2"/>
              </svg>
              Cliquez pour placer le deuxième coin du rectangle
              <button type="button" className="map-selector__reset-btn" onClick={handleReset}>Recommencer</button>
            </span>
          ) : (
            <span className="map-selector__status map-selector__status--ready">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cliquez pour placer le premier coin du rectangle
            </span>
          )}
        </div>

        <div ref={mapContainerRef} className="map-selector__map" />

        <div className="map-selector__footer">
          <button type="button" className="map-selector__btn map-selector__btn--cancel" onClick={handleCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
