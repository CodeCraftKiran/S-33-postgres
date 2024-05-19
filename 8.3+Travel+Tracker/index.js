import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "",
  port: 5432,
});

db.connect();

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((row) =>{
    countries.push(row['country_code'])
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render('index.ejs', {countries: countries, total: countries.length})
});


app.post("/add", async( req, res) => {
  const country_name = req.body.country;
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) like '%' || $1 || '%'",
      [country_name.toLowerCase()]);
    const country_code = result.rows[0]['country_code'];

    try {
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [country_code])
    res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
    
} catch (err){
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    error: "Country does not exist! Please try again!"
  })
}
})


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
