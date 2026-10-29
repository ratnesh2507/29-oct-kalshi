import { test, expect } from "bun:test";
import axios from "axios";

const BACKEND_URL = "http://localhost:3001";

const USERNAME = `harkirat-${Math.random()}`;

test("If username is small, the signup endpoint should return a 411 status code", async () => {
  try {
    const response = await axios.post(`${BACKEND_URL}/signup`, {
      username: "a",
      password: "asdasdadskjadskj",
    });

    expect.fail();
  } catch (e) {
    console.log(e.status);
    expect(e.status).toBe(411);
  }
});

test("If the username and pasword are not present it should return a 411", async () => {
  try {
    const response = await axios.post(`${BACKEND_URL}/signup`, {});

    expect.fail();
  } catch (e) {
    console.log(e.status);
    expect(e.status).toBe(411);
  }
});

test("If the username and pasword are not present it should return a 412", async () => {
  const res = await axios.post(`${BACKEND_URL}/signup`, {
    username: USERNAME,
    password: "123123",
  });
  expect(res.status).toBe(200);

  try {
    await axios.post(`${BACKEND_URL}/signup`, {
      username: USERNAME,
      password: "123123",
    });
  } catch (e) {
    console.log(e.status);
    expect(e.status).toBe(412);
  }
});

test("If the username and password are correct, signin should return a 200", async () => {
  const username = `signin-${Math.random()}`;
  const password = "123456";

  await axios.post(`${BACKEND_URL}/signup`, {
    username,
    password,
  });

  const res = await axios.post(`${BACKEND_URL}/signin`, {
    username,
    password,
  });

  expect(res.status).toBe(200);
});

test("User should be able to onramp USD", async () => {
  const username = `onramp-${Math.random()}`;
  const password = "123456";

  await axios.post(`${BACKEND_URL}/signup`, {
    username,
    password,
  });

  const response = await axios.post(`${BACKEND_URL}/onramp`, {
    username,
    amount: 100,
  });

  expect(response.status).toBe(200);
  expect(response.data.balance).toBe(100);
});

test("User should be able to onramp multiple times", async () => {
  const username = `onramp-multiple-${Math.random()}`;
  const password = "123456";

  await axios.post(`${BACKEND_URL}/signup`, {
    username,
    password,
  });

  await axios.post(`${BACKEND_URL}/onramp`, {
    username,
    amount: 100,
  });
  const response = await axios.post(`${BACKEND_URL}/onramp`, {
    username,
    amount: 50,
  });

  expect(response.status).toBe(200);
  expect(response.data.balance).toBe(150);
});
