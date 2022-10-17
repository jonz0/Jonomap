import React from "react";
import MyMarker from "./MyMarker";
import { v4 as uuidv4 } from "uuid";

export default function MarkerList({ markers, deleteMarker }) {
  return Object.values(markers).map((marker) => {
    return (
      <MyMarker key={uuidv4()} marker={marker} deleteMarker={deleteMarker} />
    );
  });
}
