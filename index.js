import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "jm",
  password: "638726",
  port: "5432"
});

db.connect();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


//All valid countries
async function validCountry() {
  const result = await db.query("select country_code from countries");
  let fixed_country_code = [];
  result.rows.forEach((i) => {
    fixed_country_code.push(i.country_code);
  });
  return fixed_country_code;
};

//All visited countries
async function checkVisited() {
  const result = await db.query("select country_code from visited_countries");
  let visited_country_code = [];
  result.rows.forEach((i) => {
    visited_country_code.push(i.country_code);
  });
  return visited_country_code;
};

//No of visited countries
async function totalVisitedCountry() {
  const result = await db.query("select count(*) from visited_countries");
  return result.rows[0].count;
};

app.get("/", async (req, res) => {
  const total_visited_country_count = await totalVisitedCountry();
  const visited_country_code = await checkVisited();
  res.render("index.ejs", {
    total: total_visited_country_count,
    countries: visited_country_code,
  });
});


app.post("/add", async (req, res) => {
  const user_input = req.body["country"].toUpperCase();
  const checkIf1 = await db.query("select count(*) from visited_countries where country_code = $1", [user_input]);
  const countries = await validCountry();
  const total_visited_country_count = await totalVisitedCountry();
  const visited_country_code = await checkVisited();
  let error;

  if (checkIf1.rows[0].count === '0') {
    if (countries.includes(`${user_input}`)) {
      await db.query("insert into visited_countries (country_code) values ($1)", [user_input]);
    } else {
      error = "Invalid country code entered.";
    }
  } else {
    error = "Country already exists.";
  }
  res.render("index.ejs", {
    total: total_visited_country_count,
    countries: visited_country_code,
    error: error,
  });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
