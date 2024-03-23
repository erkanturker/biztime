process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let companies;
let industries;

beforeEach(async () => {
  companies = await db.query(
    `INSERT INTO companies (code,name,description) 
        VALUES ('tesla','Tesla Car Inc','Maker of Tesla Model Y')
        RETURNING code,name,description`
  );
  industries = await db.query(`INSERT INTO industries 
  VALUES ('tech', 'Technology'),('energy', 'Energy') RETURNING *`);

  await db.query(`INSERT INTO industry_company VALUES ('tech','tesla')`);
});

afterEach(async () => {
  await db.query("DELETE FROM industry_company");
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM industries");
});

afterAll(async () => {
  db.end();
});

describe("POST /", () => {
  test("should respond with status 201 and inserted industry data", async () => {
    const industryData = { code: "auto", industry: "Automotive" };
    const res = await request(app).post("/industries").send(industryData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("code", "auto");
    expect(res.body).toHaveProperty("industry", "Automotive");
  });
});

describe("GET /industries/associate", () => {
  test("should respond with status 200 and return industry data with associated company codes", async () => {
    const res = await request(app).get("/industries");
    expect(res.status).toBe(200);

    // Assert the structure and data of the response
    expect(res.body).toEqual({
      tech: ["tesla"],
      energy: [],
    });
  });
});

describe("POST /associate", () => {
  test("should associate company with industry and respond with status 200", async () => {
    const companyCode = "tesla";
    const industryCode = "energy";

    const res = await request(app)
      .post("/industries/associate")
      .send({ companyCode, industryCode });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("added");
  });
  test("should respond with status 400 if companyCode is missing", async () => {
    const res = await request(app)
      .post("/industries/associate")
      .send({ industryCode: "tech" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "companyCode and industryCode fields are required"
    );
  });

  test("should respond with status 400 if industryCode is missing", async () => {
    const res = await request(app)
      .post("/industries/associate")
      .send({ companyCode: "tesla" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "companyCode and industryCode fields are required"
    );
  });

  test("should respond with status 404 if companyCode does not exist", async () => {
    const res = await request(app)
      .post("/industries/associate")
      .send({ companyCode: "invalidCode", industryCode: "tech" });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain(
      "The company was not found with the code"
    );
  });

  test("should respond with status 404 if industryCode does not exist", async () => {
    const res = await request(app)
      .post("/industries/associate")
      .send({ companyCode: "tesla", industryCode: "invalidCode" });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain(
      "The industry was not found with the code"
    );
  });
});
