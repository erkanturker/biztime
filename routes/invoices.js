const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const resp = await db.query("SELECT * FROM invoices");

    return res.json({ invoices: resp.rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const resp = await db.query(
      "SELECT * FROM invoices JOIN companies ON invoices.comp_code=companies.code WHERE invoices.id=$1",
      [id]
    );

    if (resp.rows.length === 0)
      throw new ExpressError("The invoice was not found", 404);

    const { amt, paid, add_date, paid_date, code, name, description } =
      resp.rows[0];

    return res.json({
      invoice: { id, comp_code: code, amt, paid, add_date, paid_date },
      company: { code, name, description },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    if (!comp_code || !amt)
      throw new ExpressError("comp_code and amt fields are required", 400);

    const resp = await db.query(
      `INSERT INTO invoices (comp_code,amt)VALUES($1,$2) RETURNING * `,
      [comp_code, amt]
    );

    return res.json({ invoice: resp.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    let { amt, paid } = req.body;
    const { id } = req.params;
    let resp;

    if (!amt) throw new ExpressError("amt fields are required", 400);

    if (paid) {
      const paidDate = new Date().toISOString();

      resp = await db.query(
        `UPDATE invoices SET amt=$1,paid=$2, paid_date=$3 WHERE id=$4 RETURNING *`,
        [amt, paid, paidDate, id]
      );
    } else {
      if (paid === undefined) paid = false;

      resp = await db.query(
        `UPDATE invoices SET amt=$1,paid=$2, paid_date=null WHERE id=$3 RETURNING *`,
        [amt, paid, id]
      );
    }

    if (resp.rows.length === 0)
      throw new ExpressError("The invoice was not found", 404);

    return res.json({ invoice: resp.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const resp = await db.query(
      `DELETE FROM invoices WHERE id=$1 RETURNING *`,
      [id]
    );
    if (resp.rows.length === 0)
      throw new ExpressError("The invoice was not found", 404);
    return res.json({ status: "deleted" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
