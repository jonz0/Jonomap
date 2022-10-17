import React from "react";
import Line from "./Line";
import { v4 as uuidv4 } from "uuid";

export default function PolylineList({ lines }) {
  console.log("THERE ARE " + lines.length + " LINES");
  return lines.map((line) => {
    return <Line key={uuidv4()} line={line} />;
  });
}
