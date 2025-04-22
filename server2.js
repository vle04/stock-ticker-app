const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const http = require('http');
const url = require('url');

// connection string
const urlString = 'mongodb+srv://vle04:tohruai9894@cluster0.gfpfgzd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const PORT = process.env.PORT || 8080;

// only want mongodb to run when user submits the form
http.createServer(async (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});

  // parse the url, detect the route
  urlObj = url.parse(req.url, true);
  path = urlObj.pathname;

  if (path == "/") {
    file = "home.html";
    fs.readFile(file, function(err, home) {
      if (err) {
        res.writeHead(500);
        return res.end("error loading home page");
      }
      res.write(home);
      res.end();
    })
  } else if (path == "/process") {
    // searching logic
    const {query, type} = urlObj.query;

    if (!query || !type) {
      res.writeHead(400);
      return res.end("missing query or type");
    }

    try {
      // wait to connect to db
      const client = await MongoClient.connect(urlString);
      var dbo = client.db("Stock");
      var coll = dbo.collection('PublicCompanies');

      let searchQuery = {};
      if (type == "company") {
        searchQuery = { name: query };
      } else if (type == "ticker") {
        searchQuery = { ticker: query };
      }

      // find the results and store it all in an array
      const results = await coll.find(searchQuery).toArray();

      if (results.length == 0) {
        res.write("no matching records found");
      } else {
        res.write("matching companies:<ul>");
        results.forEach(doc => {
          res.write(`<li>${doc.name} (${doc.ticker}): $${doc.price}</li>`);
          console.log("name: " + doc.name, "ticker: " + doc.ticker, "price: $" + doc.price);
        })
        res.write("</ul>");
      }
      res.end();
      await client.close();
    } catch (err) {
      console.error("error submitting form", err);
    }
  }
}).listen(PORT, () => {
  console.log("server running on port", PORT);
});