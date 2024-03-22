const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const resp = await db.query("SELECT * FROM companies");
    return res.json({ companies: resp.rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const resp = await db.query(`SELECT * FROM companies WHERE code=$1`, [
      code,
    ]);

    if (resp.rows.length === 0)
      throw new ExpressError("The company was not found", 404);

    return res.json({ company: resp.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name || !description)
      throw new ExpressError("code,name and descripton required", 400);

    const resp = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1,$2,$3) RETURNING *`,
      [code, name, description]
    );
    return res.json({ company: resp.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { code } = req.params;

    const resp = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`,
      [name, description, code]
    );

    if (resp.rows.length === 0)
      throw new ExpressError("The company was not found", 404);

    return res.json({ company: resp.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const resp = await db.query(
      `DELETE FROM companies WHERE code=$1 RETURNING *`,
      [code]
    );

    if (resp.rows.length === 0)
      throw new ExpressError("The company was not found", 404);

    return res.json({ status: "deleted" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
