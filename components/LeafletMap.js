"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

const salonIcon = L.divIcon({
  className: "salon-map-marker",
  html: '<span aria-hidden="true"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
  popupAnchor: [0, -32],
});

export default function LeafletMap({ location }) {
  const mapElement = useRef(null);

  useEffect(() => {
    if (!mapElement.current) return undefined;

    const position = [location.lat, location.lon];
    const map = L.map(mapElement.current, {
      center: position,
      zoom: 16,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const popupContent = document.createElement("div");
    const salonName = document.createElement("strong");
    salonName.textContent = "Old Town Barbers";
    const address = document.createElement("p");
    address.textContent = location.displayName;
    popupContent.append(salonName, address);

    L.marker(position, { icon: salonIcon, title: "Old Town Barbers" })
      .addTo(map)
      .bindPopup(popupContent);

    return () => map.remove();
  }, [location.displayName, location.lat, location.lon]);

  return (
    <div
      ref={mapElement}
      role="region"
      aria-label={`Map showing the salon at ${location.displayName}`}
      className="relative z-0 h-full min-h-72 w-full"
    />
  );
}
