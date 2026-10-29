import { test, expect } from "bun:test";
import axios from "axios";
import { UserModel, MarketModel, StockBalanceModel } from "./schema";

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

test("User should be able to create market", async () => {
  const username = `market-${Math.random()}`;
  const password = "123456";

  await axios.post(`${BACKEND_URL}/signup`, {
    username,
    password,
  });

  const signInResponse = await axios.post(`${BACKEND_URL}/signin`, {
    username,
    password,
  });

  const token = signInResponse.data.token;
  const response = await axios.post(
    `${BACKEND_URL}/market`,
    {
      title: "Will Trump win 2026 Elections?",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  expect(response.status).toBe(200);
  expect(response.data.title).toBe("Will Trump win 2026 Elections?");
  expect(response.data.id).toBeDefined();
});

test("User should not be able to create a market without being authenticated", async () => {
  try {
    await axios.post(`${BACKEND_URL}/market`, {
      title: "Will Trump win 2026 Elections?",
    });
    expect.fail();
  } catch (e) {
    expect(e.status).toBe(401);
  }
});

test("User should be able to get all markets", async () => {
  const username = `markets-${Math.random()}`;
  const password = "123456";
  await axios.post(`${BACKEND_URL}/signup`, {
    username,
    password,
  });

  const signInResponse = await axios.post(`${BACKEND_URL}/signin`, {
    username,
    password,
  });

  const token = signInResponse.data.token;
  await axios.post(
    `${BACKEND_URL}/market`,
    {
      title: "Will Trump win 2026 Elections?",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const response = await axios.get(`${BACKEND_URL}/markets`);

  expect(response.status).toBe(200);
  expect(response.data.markets).toBeDefined();
  expect(response.data.markets.length).toBeGreaterThan(0);
});

test("User should be able to split USD into YES and NO stocks", async () => {
  const username = `markets-${Math.random()}`;
  const password = "123456";
  await axios.post(`${BACKEND_URL}/signup`, {
    username,
    password,
  });

  const signInResponse = await axios.post(`${BACKEND_URL}/signin`, {
    username,
    password,
  });

  const token = signInResponse.data.token;
  await axios.post(`${BACKEND_URL}/onramp`, {
    username,
    amount: 100,
  });
  const marketResponse = await axios.post(
    `${BACKEND_URL}/market`,
    {
      title: "Will Trump win 2026 Elections?",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const marketId = marketResponse.data.id;
  const response = await axios.post(
    `${BACKEND_URL}/split`,
    {
      marketId,
      amount: 100,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  expect(response.status).toBe(200);

  const user = await UserModel.findOne({
    username,
  });

  expect(user?.usdBalance).toBe(0);

  const yesBalance = await StockBalanceModel.findOne({
    userId: user?._id,
    marketId,
    type: "yes",
  });

  const noBalance = await StockBalanceModel.findOne({
    userId: user?._id,
    marketId,
    type: "no",
  });

  expect(yesBalance?.qty).toBe(100);
  expect(noBalance?.qty).toBe(100);

  const market = await MarketModel.findById(marketId);

  expect(market?.totalIssued).toBe(100);
});

test("User should be able to merge YES and NO stocks back into USD", async () => {
  const username = `merge-${Math.random()}`;
  const password = "123456";

  await axios.post(`${BACKEND_URL}/signup`, {
    username,
    password,
  });

  const signInResponse = await axios.post(`${BACKEND_URL}/signin`, {
    username,
    password,
  });

  const token = signInResponse.data.token;

  await axios.post(`${BACKEND_URL}/onramp`, {
    username,
    amount: 100,
  });

  const marketResponse = await axios.post(
    `${BACKEND_URL}/market`,
    {
      title: "Will Trump win 2026 Elections?",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const marketId = marketResponse.data.id;

  await axios.post(
    `${BACKEND_URL}/split`,
    {
      marketId,
      amount: 100,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const response = await axios.post(
    `${BACKEND_URL}/merge`,
    {
      marketId,
      amount: 40,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  expect(response.status).toBe(200);

  const user = await UserModel.findOne({
    username,
  });
  expect(user?.usdBalance).toBe(40);

  const yesBalance = await StockBalanceModel.findOne({
    userId: user?._id,
    marketId,
    type: "yes",
  });
  const noBalance = await StockBalanceModel.findOne({
    userId: user?._id,
    marketId,
    type: "no",
  });
  expect(yesBalance?.qty).toBe(60);
  expect(noBalance?.qty).toBe(60);

  const market = await MarketModel.findById(marketId);
  expect(market?.totalIssued).toBe(60);
});
