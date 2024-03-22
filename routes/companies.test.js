process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let company;
let invoice;

beforeEach(async () => {
  company = await db.query(
    `INSERT INTO companies (code,name,description) 
    VALUES ('tesla','Tesla Car Inc','Maker of Tesla Model Y')
    RETURNING code,name,description`
  );
  invoice = await db.query(`INSERT INTO invoices
  (comp_Code, amt, paid, paid_date)
  VALUES ('tesla', 100, false, null) RETURNING *`);
});

describe("GET /companies", () => {
  test("should get all companies", async () => {
    const resp = await request(app).get("/companies");
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      companies: [
        {
          code: "tesla",
          name: "Tesla Car Inc",
          description: "Maker of Tesla Model Y",
        },
      ],
    });
  });
});

describe("GET /companies/:code", () => {
  test("should get company with their invoices", async () => {
    const resp = await request(app).get(`/companies/${company.rows[0].code}`);
    expect(resp.status).toBe(200);
    const expectedCompany = company.rows[0];
    const expectedinvoice = invoice.rows.map((r) => ({
      ...r,
      add_date: r.add_date.toISOString(),
    }));
    expect(resp.body).toEqual({
      company: expectedCompany,
      invoices: expectedinvoice,
    });
  });
  test("should get 404 with invalid code", async () => {
    const resp = await request(app).get("/companies/lmtx");
    expect(resp.status).toBe(404);
  });
});

describe("Company Routes", () => {
  describe("POST /companies", () => {
    test("should create a new company", async () => {
      const newCompany = {
        code: "test",
        name: "Test Company",
        description: "This is a test company",
      };

      const response = await request(app)
        .post("/companies")
        .send(newCompany)
        .expect(200);

      expect(response.body.company.code).toBe(newCompany.code);
      expect(response.body.company.name).toBe(newCompany.name);
      expect(response.body.company.description).toBe(newCompany.description);
    });

    test("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/companies")
        .send({})
        .expect(400);

      expect(response.body.message).toBe("code,name and description required");
    });
  });

  describe("PUT /companies/:code", () => {
    test("should update an existing company", async () => {
      const updatedCompany = {
        name: "Updated Company",
        description: "This is the updated description",
      };

      const response = await request(app)
        .put(`/companies/${company.rows[0].code}`)
        .send(updatedCompany)
        .expect(200);

      expect(response.body.company.name).toBe(updatedCompany.name);
      expect(response.body.company.description).toBe(
        updatedCompany.description
      );
    });

    test("should return 404 if company not found", async () => {
      const response = await request(app)
        .put("/companies/nonexistent")
        .send({
          name: "Updated Company",
          description: "This is the updated description",
        })
        .expect(404);

      expect(response.body.message).toBe("The company was not found");
    });
  });

  describe("DELETE /companies/:code", () => {
    test("should delete an existing company", async () => {
      const response = await request(app)
        .delete(`/companies/${company.rows[0].code}`)
        .expect(200);

      expect(response.body.status).toBe("deleted");
    });

    test("should return 404 if company not found", async () => {
      const response = await request(app)
        .delete("/companies/nonexistent")
        .expect(404);

      expect(response.body.message).toBe("The company was not found");
    });
  });
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
  await db.end();
});
