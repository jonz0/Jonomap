import React from "react";
import { useJsApiLoader, GoogleMap, Polyline } from "@react-google-maps/api";

export default function Line(line) {
  const coordinates = [
    { lat: line.lat1, lng: line.lng1 },
    { lat: line.lat2, lng: line.lng2 },
  ];

  return (
    <div>
      <Polyline
        path={coordinates}
        geodesic={true}
        options={{
          strokeColor: "#ff2527",
          strokeOpacity: 0.75,
          strokeWeight: 2,
        }}
      />
    </div>
  );
}
