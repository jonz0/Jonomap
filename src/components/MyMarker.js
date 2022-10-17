import React, { useState, useEffect, useRef } from "react";
import { MarkerF, InfoWindowF } from "@react-google-maps/api";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { storage, db, auth, newPostKey } from "../firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { getDatabase, child, push, update } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import "../css/App.css";

export default function MyMarker({ marker, deleteMarker }) {
  const { currentUser, logout } = useAuth();
  const [popupShowing, setPopupShowing] = useState(false);
  const currentUserId = currentUser.uid;
  let markerRef = doc(db, "users", currentUserId, "markers", marker.key);
  const [imageList, setImageList] = useState([]);
  let markerPos = { lat: marker.latitude, lng: marker.longitude };
  let country = marker.country;
  let cityState = marker.city + ", " + marker.state;
  let address = marker.street;

  useEffect(() => {
    fetchImagesRef();
  }, []);

  async function fetchImagesRef() {
    // console.log("fetching...");
    // console.log("marker position: " + markerPos.lat + ", " + markerPos.lng);
    const docSnap = await getDoc(markerRef);
    const images = `${currentUserId}/${docSnap.data().imagesRef}/`;
    // console.log(docSnap.exists());
    // console.log(imagesRef);

    if (docSnap.exists()) {
      listAll(ref(storage, images)).then((response) => {
        response.items.forEach((item) => {
          getDownloadURL(item).then((url) => {
            setImageList((prev) => [...prev, url]);
          });
        });
      });
    } else {
      console.log("Error: please contact the big boss");
    }
  }

  async function handlePopupShowing() {
    // if (popupShowing) {
    //   console.log("popup showing");
    // } else {
    //   console.log("popup hidden");
    // }
    setPopupShowing(!popupShowing);
  }

  async function handleDelete() {
    deleteMarker(marker.key);
    markerRef = doc(db, "users", currentUserId, "markers", marker.key);
    const docSnap = await getDoc(markerRef);
    const images = `${currentUserId}/${docSnap.data().imagesRef}/${
      docSnap.data().hash
    }`;
    deleteObject(ref(storage, images))
      .then(() => {
        console.log("File deleted successfully");
      })
      .catch((error) => {
        console.log("Uh-oh, an error occurred!");
      });
    const hashRef = `${currentUserId}/imageHashes/${docSnap.data().hash}`;
    const imageRef = doc(db, "users", hashRef);
    await deleteDoc(markerRef);
    await deleteDoc(imageRef);
  }

  return (
    <>
      <MarkerF position={markerPos} onClick={handlePopupShowing}>
        {popupShowing && (
          <InfoWindowF position={markerPos}>
            <div>
              <section id="marker-info">
                <h1 id="country">
                  <b>{country}</b>
                </h1>
                <p>{cityState}</p>
                <p>{address}</p>
              </section>
              {imageList.map((url) => {
                return <img key={uuidv4()} src={url} id="marker-image" />;
              })}
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
                id="delete-marker"
              >
                Delete
              </button>
            </div>
          </InfoWindowF>
        )}
      </MarkerF>
    </>
  );
}
