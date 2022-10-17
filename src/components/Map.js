import React, { useEffect, useState, useRef } from "react";
// import { Box, BreadcrumbLink, Flex, Input } from "@chakra-ui/react";
import { useJsApiLoader, GoogleMap, Polyline } from "@react-google-maps/api";
import MarkerList from "./MarkerList";
import { v4 as uuidv4 } from "uuid";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { storage, db, auth, newPostKey } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, child, push, update } from "firebase/database";
import { Form, Button, Card, Alert } from "react-bootstrap";
import exifr, { gps } from "exifr";
import { SHA3 } from "crypto-js";
import { retroStyle } from "../styles/Retro";
import { auburgineStyle } from "../styles/Auburgine";
import { eyesBurningStyle } from "../styles/EyesBurning";
import PolylineList from "./PolylineList";

export default function Map() {
  const [markers, setMarkers] = useState([]);
  const [lines, setLines] = useState([]);
  const [error, setError] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });
  const { currentUser, logout } = useAuth();
  const currentUserId = currentUser.uid;
  const markerCollectionRef = collection(db, "users", currentUserId, "markers");

  useEffect(() => {
    console.log("calling useEffect");
    async function fetchData() {
      const querySnapshot = await getDocs(markerCollectionRef);
      let tempArray = [];

      querySnapshot.forEach((doc) => {
        tempArray.push({
          key: doc.id,
          latitude: doc.data().latitude,
          longitude: doc.data().longitude,
          street: doc.data().street,
          city: doc.data().city,
          state: doc.data().state,
          postal: doc.data().postal,
          country: doc.data().country,
          visitTime: doc.data().visitTime,
        });
      });

      setMarkers(sortMarkers(tempArray));
    }
    fetchData();
  }, []);

  useEffect(() => {
    handlePolylines();
  }, [markers]);

  if (!isLoaded) {
    return "Loading";
  }

  function latLongErrors(lat, long) {
    const latInvalid = lat < -90 || lat > 90;
    const longInvalid = long < -180 || long > 180;
    if (latInvalid && longInvalid) {
      return setError("Invalid latitude and longitude");
    } else if (latInvalid) {
      return setError("Invalid latitude");
    } else if (longInvalid) {
      return setError("Invalid longitude");
    } else {
      setError("");
    }
  }

  async function handleAddMarker(imageUpload) {
    const markerId = uuidv4();
    const markerName = `${markerId}`;
    const markerRef = doc(db, "users", currentUserId, "markers", markerName);
    const imageHashes = collection(db, "users", currentUserId, "imageHashes");
    let imageHash = "";

    await getBase64(imageUpload)
      .then((result) => {
        imageUpload["base64"] = result;
        imageHash = SHA3(result, { outputLength: 160 }).toString();
      })
      .catch((err) => {
        console.log(err);
      });

    checkDuplicateImages(imageHash).then((result) => {
      if (result) {
        return;
      }
      console.log("No duplicates");
      setDoc(doc(imageHashes, imageHash), { exists: true }, { merge: false });

      const imageName = `${currentUserId}/${markerId}-images/${imageHash}`;
      const imageRef = ref(storage, imageName);

      /** Uploads the passed image to Firestore under 'uid/markerId-images/', and
       * also uploads a document containing marker information associated with
       * the image to Firebase under 'users/uid/markers/markerId/'.
       */
      uploadBytes(imageRef, imageUpload).then((snapshot) => {
        getDownloadURL(snapshot.ref).then(async (url) => {
          // Marker error handling
          const { latitude: lat, longitude: long } = await exifr.gps(url);
          latLongErrors(lat, long);

          let reverseGeoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
          fetch(reverseGeoUrl)
            .then((response) => response.json())
            .then((data) => {
              let parts = data.results[0].address_components;
              let city = "",
                state = "",
                country = "",
                street = "",
                postal = "";
              parts.forEach((part) => {
                switch (true) {
                  case part.types.includes("country"):
                    country = part.long_name;
                    break;
                  case part.types.includes("administrative_area_level_1"):
                    state += part.long_name;
                    break;
                  case part.types.includes("locality"):
                    city = part.long_name;
                    break;
                  case part.types.includes("street_number"):
                    street += part.long_name;
                    break;
                  case part.types.includes("route"):
                    street += " " + part.long_name;
                    break;
                  case part.types.includes("postal_code"):
                    postal += part.long_name;
                    break;
                  default:
                    console.log("error");
                    break;
                }
              });

              exifr.parse(url).then((output) => {
                setDoc(
                  markerRef,
                  {
                    latitude: output.latitude,
                    longitude: output.longitude,
                    street: street,
                    city: city,
                    state: state,
                    country: country,
                    postal: postal,
                    visitTime: output.DateTimeOriginal.getTime(),
                    // visitTime: output.DateTimeOriginal.toUTCString(),
                    imagesRef: markerName + "-images",
                    hash: imageHash,
                  },
                  { merge: false }
                );

                setMarkers((prevMarkers) => {
                  let tempMarkers = [...prevMarkers];
                  tempMarkers.push({
                    key: markerId,
                    latitude: lat,
                    longitude: long,
                    street: street,
                    city: city,
                    state: state,
                    postal: postal,
                    country: country,
                    visitTime: output.DateTimeOriginal.getTime(),
                  });
                  return sortMarkers(tempMarkers);
                });
              });
            })
            .catch((err) => console.warn("reverse geocoding fetch error"));
        });
      });
    });
  }

  function sortMarkers(m) {
    let temp = [...m];
    temp.sort(function (a, b) {
      var keyA = new Date(a.visitTime),
        keyB = new Date(b.visitTime);
      // Compare the 2 dates
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
    console.log("markers sorted...");
    return temp;
  }

  async function handlePolylines() {
    console.log("handling polylines with " + markers.length + " markers.");
    if (markers.length < 2) {
      console.log("There are only " + markers.length + " markers.");
      return;
    }

    for (let i = 0; i < markers.length - 1; i++) {
      let tempMarkerId = markers[i].key;
      let nextMarkerId = markers[i + 1].key;
      const firstMarkerRef = doc(
        db,
        "users",
        currentUserId,
        "markers",
        tempMarkerId
      );
      const nextMarkerRef = doc(
        db,
        "users",
        currentUserId,
        "markers",
        nextMarkerId
      );
      const firstSnapshot = await getDoc(firstMarkerRef);
      const nextSnapshot = await getDoc(nextMarkerRef);

      setLines((prevLines) => {
        return [
          ...prevLines,
          {
            lit: "wanksauce",
            lat1: parseFloat(firstSnapshot.data().latitude),
            long1: parseFloat(firstSnapshot.data().longitude),
            lat2: parseFloat(nextSnapshot.data().latitude),
            long2: parseFloat(nextSnapshot.data().longitude),
          },
        ];
      });
    }
  }

  /** Encodes a given image into a Base64 binary format. */
  function getBase64(file) {
    return new Promise((resolve) => {
      let baseURL = "";
      // Make new FileReader
      let reader = new FileReader();
      // Convert the file to Base64 text
      reader.readAsDataURL(file);
      // Returns the result of the reader on load
      reader.onload = () => {
        baseURL = reader.result;
        resolve(baseURL);
      };
    });
  }

  /** Calls handleAddMarker on each uploaded file upon submitting. */
  async function handleSubmit() {
    if (imageUpload.length === 0) return;
    await imageUpload.forEach((file) => {
      console.log("doing this thing");
      handleAddMarker(file);
    });
  }

  /** Debug button (remove on production) */
  function debug() {
    console.log("original");
    console.log(markers);
  }

  /** Stores an array of uploaded files into the imageUpload state. */
  function handleFiles(event) {
    setImageUpload(null);
    const images = [];
    Array.from(event.target.files).forEach((file) => {
      images.push(file);
      setImageUpload(images);
    });
  }

  async function checkDuplicateImages(imageHash) {
    const docRef = doc(db, "users", currentUserId, "imageHashes", imageHash);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Duplicate image not uploaded");
      return true;
    }
    return false;
  }

  function deleteMarker(id) {
    setLines([]);
    setMarkers(
      markers.filter(function (marker) {
        return marker.key !== id;
      })
    );
  }

  return (
    <div id="app-container">
      <div id="menu-container">
        <h1 id="header-1">EXIF Mapper</h1>
        <div className="mb-3">
          <label format="formFile" className="form-label">
            Wagwan, fam! 🇨🇦
            <br />
            <br /> This mapper tool reads EXIF data from uploaded images and
            maps them using Google Maps. Your journeys are chronologically
            mapped between the locations at which each image was taken.
            <br />
            <br />
            Drop your images here and let's run a 1-2 EXIF Mapper, eh?
          </label>
          <hr />
          <input
            className="form-control"
            type="file"
            id="formFile"
            multiple
            onChange={handleFiles}
          />
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        <div className="buttons">
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            id="submit-button"
          >
            Submit
          </button>
          <button onClick={debug} id="debug-button" className="btn btn-danger">
            Debug
          </button>
        </div>
      </div>
      <div id="map-container">
        <GoogleMap
          zoom={1}
          // minZoom={4}
          options={{
            mapTypeId: "terrain",
            streetViewControl: false,
            mapTypeControl: false,
            styles: retroStyle,
            minZoom: 2,
            restriction: {
              latLngBounds: {
                north: 85,
                south: -85,
                west: -180,
                east: 180,
              },
              strictBounds: false,
            },
            // draggable: false,
          }}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={{ lat: 0, lng: 0 }}
        >
          <MarkerList markers={markers} deleteMarker={deleteMarker} />
          <PolylineList lines={lines} />
          {/* <Polyline
            path={[
              { lat: 37.772, lng: -122.214 },
              { lat: 21.291, lng: -157.821 },
            ]}
            geodesic={true}
            options={{
              strokeColor: "#ff2527",
              strokeOpacity: 0.75,
              strokeWeight: 2,
            }} */}
          />
        </GoogleMap>
      </div>
    </div>
  );
}
