import React, { useState, useEffect } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { storage, db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState();
  const [lastName, setLastName] = useState();
  const [age, setAge] = useState();

  async function handleLogout() {
    setError("");
    try {
      await logout();
      navigate("/");
    } catch (error) {
      setError("Failed to log out");
    }
  }

  async function handleDataDisplay() {
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setFirstName(docSnap.data().firstName);
      setLastName(docSnap.data().lastName);
      setAge(docSnap.data().age);
    } else {
      setError("Error: please contact the big boss");
    }
  }

  useEffect(() => {
    handleDataDisplay();
  });

  return (
    <>
      <Card>
        <Card.Body>
          <h2 className="text-cetner mb-4">Profile</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <strong>
            Welcome, {useAuth().currentUser.email}!
            <br />
          </strong>
          <strong>Email: </strong> {currentUser.email}
          <Link to="/update-profile" className="btn btn-primary w-100 mt-3">
            Update Profile
          </Link>
          <hr />
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
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </>
  );
}
