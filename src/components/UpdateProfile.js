import React, { useRef, useState } from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";
import "../css/Signup.css";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import validator from "validator";
import { doc, setDoc, collection } from "firebase/firestore";
import { storage, db } from "../firebase";
import "../css/App.css";

export default function UpdateProfile() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const ageRef = useRef();
  const passwordConfirmRef = useRef();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser, updateEmail, updatePassword } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    const validName = new RegExp(
      "/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u"
    );

    if (
      validName.test(firstNameRef.current.value) ||
      validName.test(lastNameRef.current.value)
    ) {
      return setError("Please enter a valid name.");
    }

    if (
      isNaN(ageRef.current.value) ||
      ageRef.current.value < 1 ||
      ageRef.current.value > 150
    ) {
      return setError("Please enter a valid age.");
    }

    const promises = [];
    setLoading(true);
    setError("");
    if (emailRef.current.value !== currentUser.email) {
      promises.push(updateEmail(emailRef.current.value));
    }
    if (passwordRef.current.value !== currentUser.password) {
      promises.push(updatePassword(passwordRef.current.value));
    }

    const userRef = doc(db, "users", currentUser.uid);
    setDoc(
      userRef,
      {
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        age: ageRef.current.value,
      },
      { merge: false }
    );

    Promise.all(promises)
      .then(() => {
        navigate("/");
      })
      .catch(() => {
        setError("Failed to update account.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div id="auth-center">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Update Profile</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group id="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                ref={emailRef}
                defaultValue={currentUser.email}
              />
            </Form.Group>

            <Form.Group id="firstname">
              <Form.Label>First name</Form.Label>
              <Form.Control type="text" ref={firstNameRef}></Form.Control>
            </Form.Group>

            <Form.Group id="lastname">
              <Form.Label>Last name</Form.Label>
              <Form.Control type="text" ref={lastNameRef}></Form.Control>
            </Form.Group>

            <Form.Group id="age">
              <Form.Label>Age</Form.Label>
              <Form.Control type="text" ref={ageRef}></Form.Control>
            </Form.Group>

            <Form.Group id="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                ref={passwordRef}
                placeholder="Leave blank to keep the same password"
              ></Form.Control>
            </Form.Group>

            <Form.Group id="password-confirm">
              <Form.Label>Password Confirmation</Form.Label>
              <Form.Control
                type="password"
                ref={passwordConfirmRef}
              ></Form.Control>
            </Form.Group>
            <Button disabled={loading} className="w-100" type="submit">
              Update
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        Cancel <Link to="/">Cancel</Link>
      </div>
    </div>
  );
}
