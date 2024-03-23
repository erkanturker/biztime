DROP DATABASE IF EXISTS biztime;
CREATE DATABASE biztime;

\c biztime;

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries(
  code text PRIMARY KEY,
  industry text NOT NULL UNIQUE
);

CREATE TABLE industry_company(
  industry_code TEXT,
  company_code TEXT,
  PRIMARY KEY (industry_code,company_code),
  FOREIGN KEY (industry_code) REFERENCES industries(code),
  FOREIGN KEY (company_code) REFERENCES companies(code)
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO industries 
  VALUES ('tech', 'Technology'),
('auto', 'Automotive'),
('electronics', 'Electronics'),
('software', 'Software'),
('energy', 'Energy'),
('manufacturing', 'Manufacturing'),
('healthcare', 'Healthcare');

INSERT INTO industry_company
  VALUES ('software','apple'),
  ('electronics','apple'),
  ('tech','apple'),
  ('healthcare','ibm'),
  ('tech','ibm'),
  ('electronics', 'ibm');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);
