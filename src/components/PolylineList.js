import React from "react";
import MarkerLine from "./Line";
import { v4 as uuidv4 } from "uuid";

export default function PolylineList({ lines }) {
  return lines.map((line) => {
    return <MarkerLine key={line.key} line={line} />;
  });
}
