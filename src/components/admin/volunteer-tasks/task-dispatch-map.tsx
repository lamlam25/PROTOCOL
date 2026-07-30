"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Geographic center of Bangladesh — used as the default map view when there are no geo-tagged tasks yet. */
const BANGLADESH_CENTER: [number, number] = [23.685, 90.3563];

export interface DispatchMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  statusLabel: string;
  href: string;
}

export default function TaskDispatchMap({
  markers,
  detailsLabel,
}: {
  markers: DispatchMapMarker[];
  detailsLabel: string;
}) {
  const center = useMemo<[number, number]>(
    () => (markers.length > 0 ? [markers[0].lat, markers[0].lng] : BANGLADESH_CENTER),
    [markers]
  );

  return (
    <MapContainer
      center={center}
      zoom={markers.length > 0 ? 8 : 7}
      scrollWheelZoom
      style={{ height: 420, width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-medium">{m.title}</p>
              <p className="text-muted-foreground">{m.statusLabel}</p>
              <a href={m.href} className="text-primary hover:underline">
                {detailsLabel}
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
