const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    if (!code || !industry)
      throw new ExpressError("code and industry fields are required", 400);

    const resp = await db.query(
      `INSERT INTO industries VALUES ($1,$2) RETURNING *`,
      [code, industry]
    );

    return res.status(201).json(resp.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post("/associate", async (req, res, next) => {
  try {
    const { companyCode, industryCode } = req.body;
    if (!companyCode || !industryCode)
      throw new ExpressError(
        "companyCode and industryCode fields are required",
        400
      );

    const respComp = await db.query(`SELECT * FROM companies WHERE code=$1`, [
      companyCode,
    ]);

    if (respComp.rows.length === 0)
      throw new ExpressError(
        "The company was not found with the code " + companyCode,
        404
      );

    const respInd = await db.query(`SELECT * FROM industries WHERE code=$1`, [
      industryCode,
    ]);

    if (respInd.rows.length === 0)
      throw new ExpressError(
        "The industry was not found with the code " + industryCode,
        404
      );

    const result = db.query("INSERT INTO industry_company VALUES ($1,$2)", [
      industryCode,
      companyCode,
    ]);
    res.json({ status: "added" });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const resp = await db.query(`SELECT i.code, ic.company_code
    FROM industries AS i
    LEFT JOIN industry_company AS ic ON i.code=ic.industry_code`);

    const industryCode = resp.rows.reduce((acc, { code, company_code }) => {
      acc[code] = acc[code] || [];
      if (company_code) acc[code].push(company_code);
      return acc;
    }, {});

    return res.json(industryCode);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
