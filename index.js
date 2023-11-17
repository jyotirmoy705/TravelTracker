import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "jm",
  password: "638726",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function userRecord() {
  const result = await db.query("select * from users");
  let userData = [];
  result.rows.forEach((i) => {
    userData.push(i);
  });
  return userData;
}

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries where user_id = $1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
async function getCurrentUser() {
  const result = await db.query("select * from users");
  return result.rows.find((i) => i.id == currentUserId);
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUserColor = await getCurrentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: await userRecord(),
    color: currentUserColor.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE ($1 || '%');",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const error = "Duplicate Entry. Try again";
    const countries = await checkVisisted();
    const currentUserColor = await getCurrentUser();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: await userRecord(),
      color: currentUserColor.color,
      error: error,
    });
    }
  } catch (err) {
    console.log(err);
    const error = "Invalid entry. Try again";
    const countries = await checkVisisted();
    const currentUserColor = await getCurrentUser();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: await userRecord(),
      color: currentUserColor.color,
      error: error,
    });
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const inputName = req.body.name;
  const inputColor = req.body.color;
  const result = await db.query("insert into users(name, color) values($1, $2) returning *;", [inputName, inputColor]);
  const currentUserId = result.rows[0].id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
