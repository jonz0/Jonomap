import React, { useEffect, useState, useRef } from "react";
import { storage, db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { ref, uploadBytes, listAll, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../css/Images.css";

export default function Images() {
  const [imageUpload, setImageUpload] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [firstName, setFirstName] = useState();
  const [lastName, setLastName] = useState();
  const [age, setAge] = useState();
  const { currentUser, logout } = useAuth();
  const currentUserId = currentUser.uid + "/";
  const docRef = doc(db, "users", currentUser.uid);

  async function displayUserData() {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const imageListRef = docSnap.data().userStorageRef;

      // Displays user data
      setFirstName(docSnap.data().firstName);
      setLastName(docSnap.data().lastName);
      setAge(docSnap.data().age);

      // Displays images stored in uid/images/
      listAll(ref(storage, imageListRef)).then((response) => {
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

  useEffect(() => {
    displayUserData();
  }, []);

  const userRef = doc(db, "users", currentUser.uid);
  function uploadImage() {
    if (imageUpload == null) return;
    const imageName = `${currentUserId}images/${imageUpload.name + uuidv4()}`;
    const imageRef = ref(storage, imageName);

    // Uploads image to firestore
    uploadBytes(imageRef, imageUpload).then((snapshot) => {
      getDownloadURL(snapshot.ref).then((url) => {
        setImageList((prev) => [...prev, url]);
      });
    });

    // Adds image url to firebase user doc
    setDoc(
      userRef,
      {
        userStorageRef: currentUserId + "images/",
      },
      { merge: true }
    );
  }

  return (
    <div id="images-center">
      <p>User Details:</p>
      <ul>
        <li>
          First name: <span id="user-firstname">{firstName}</span>
        </li>
        <li>
          Last name: <span id="user-lastname">{lastName}</span>
        </li>
        <li>
          Age: <span id="user-age">{age}</span>
        </li>
      </ul>
      <input
        type="file"
        onChange={(event) => setImageUpload(event.target.files[0])}
      />
      <button onClick={uploadImage}>Upload Image</button>

      {imageList.map((url) => {
        return <img key={uuidv4()} src={url} id="displayImg" />;
      })}
    </div>
  );
}
