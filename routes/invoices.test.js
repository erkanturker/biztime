process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let companies;
let invoices;

beforeEach(async () => {
  companies = await db.query(
    `INSERT INTO companies (code,name,description) 
    VALUES ('tesla','Tesla Car Inc','Maker of Tesla Model Y')
    RETURNING code,name,description`
  );
  invoices = await db.query(`INSERT INTO invoices
  (comp_code, amt, paid, paid_date)
  VALUES ('tesla', 100, false, null) RETURNING *`);
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("should get all invoices", async () => {
    const resp = await request(app).get("/invoices");
    expect(resp.statusCode).toBe(200);

    const expectedInvoices = invoices.rows.map((invoice) => ({
      ...invoice,
      add_date: invoice.add_date.toISOString(),
    }));

    expect(resp.body).toEqual({ invoices: expectedInvoices });
  });
});

describe("GET /invoices/:id", () => {
  test("should get a invoice", async () => {
    const resp = await request(app).get(`/invoices/${invoices.rows[0].id}`);
    expect(resp.statusCode).toBe(200);

    const expectedInvoices = invoices.rows.map((invoice) => ({
      ...invoice,
      id: invoice.id.toString(),
      add_date: invoice.add_date.toISOString(),
    }));

    expect(resp.body).toEqual({
      company: companies.rows[0],
      invoice: expectedInvoices[0],
    });
  });
  test("should get 404 error", async () => {
    const resp = await request(app).get(`/invoices/12312313`);
    expect(resp.statusCode).toBe(404);
    expect(resp.body.message).toBe("The invoice was not found");
  });
});

describe("POST /invoices", () => {
  test("should store invoice", async () => {
    const resp = await request(app)
      .post("/invoices")
      .send({ comp_code: "tesla", amt: 200 });
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "tesla",
        amt: 200,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });
  test("should return 400", async () => {
    const resp = await request(app).post("/invoices").send({});
    expect(resp.status).toBe(400);
    expect(resp.body.message).toBe("comp_code and amt fields are required");
  });
});

describe("PUT /invoices", () => {
  test("should update the invoice", async () => {
    const resp = await request(app)
      .put(`/invoices/${invoices.rows[0].id}`)
      .send({ amt: 500 });

    expect(resp.status).toBe(200);

    expect(resp.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "tesla",
        amt: 500,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });
  test("should return 400", async () => {
    const resp = await request(app)
      .put(`/invoices/${invoices.rows[0].id}`)
      .send({});
    expect(resp.status).toBe(400);
    expect(resp.body.message).toBe("amt fields are required");
  });
  test("should receive 404", async () => {
    const resp = await request(app).put(`/invoices/12313`).send({ amt: 500 });
    expect(resp.status).toBe(404);
    expect(resp.body.message).toBe("The invoice was not found");
  });
});

describe("DELETE /invoices", () => {
  test("should delete a invoice", async () => {
    const resp = await request(app).delete(`/invoices/${invoices.rows[0].id}`);
    expect(resp.status).toBe(200);
    expect(resp.body.status).toBe("deleted");
  });
  test("should receive 404", async () => {
    const resp = await request(app).delete(`/invoices/12313`);
    expect(resp.status).toBe(404);
    expect(resp.body.message).toBe("The invoice was not found");
  });
});
