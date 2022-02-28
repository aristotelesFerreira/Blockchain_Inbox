var express = require("express");
var app = express();
const shortid = require("short-id");
const IPFS = require("ipfs-api");
const ipfs = new IPFS({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

function routes(app, dbe, lms, accounts) {
  console.log(dbe.findOne);
  let db = dbe.users;
  let music = dbe.musics;

  app.post("/register", (req, res) => {
    let email = req.body.email;
    let idd = shortid.generate();
    if (email) {
      dbe.query(
        `SELECT * FROM users WHERE email = '${email}'`,
        function (err, result) {
          if (err) {
            console.log(result);
            throw err;
          }
          if (result.length == 0) {
            var sql = `INSERT INTO users (email) VALUES ('${email}')`;
            dbe.query(sql, function (err, result) {
              if (err) throw err;

              res.json({ status: "success", id: idd });
            });
          } else {
            res
              .status(400)
              .json({ status: "Failed", reason: "Already registered" });
          }
        }
      );
    } else {
      res.status(400).json({ status: "Failed", reason: "wrong input" });
    }
  });

  app.post("/login", (req, res) => {
    let email = req.body.email;
    if (email) {
      dbe.query(
        `SELECT * FROM users WHERE email = '${email}'`,
        function (err, result) {
          if (err) throw err;
          if (result.length > 0) {
            res.json({ status: "success", id: result[0].id });
          } else {
            res
              .status(400)
              .json({ status: "Failed", reason: "Not recognised" });
          }
        }
      );
    } else {
      res.status(400).json({ status: "Failed", reason: "wrong input" });
    }
  });
  app.post("/upload", async (req, res) => {
    var Buffer2 = require("buffer").Buffer;

    let buffer = req.body.buffer;
    let name = req.body.name;
    let title = req.body.title;
    let id = shortid.generate() + shortid.generate();
    var newBuffer = Buffer2.from(req.body.buffer);

    if (buffer && title) {
      let ipfsHash = await ipfs.add(newBuffer || Buffer.alloc(8));

      let hash = ipfsHash[0].hash;

      lms
        .sendIPFS(id, hash, { from: accounts[0] })
        .then((_transaction, _address) => {
          var sql = `INSERT INTO musics (generate_id, hash, title, name) VALUES ('${id}', '${hash}', '${title}', '${name}')`;
          dbe.query(sql, function (err, result) {
            if (err) throw err;
            res.json({ status: "success", id });
          });
        })
        .catch((err) => {
          console.log(err);
          res
            .status(500)
            .json({ status: "Failed", reason: "Upload error occured" });
        });
    } else {
      res.status(400).json({ status: "Failed", reason: "wrong input" });
    }
  });
  app.get("/access/:email", (req, res) => {
    if (req.params.email) {
      dbe.query(`SELECT * FROM musics`, function (err, result) {
        if (err) throw err;

        res.json({ status: "success", result });
      });
    } else {
      res.status(400).json({ status: "Failed", reason: "wrong input" });
    }
  });
  app.get("/access/:email/:id", async (req, res) => {
    let id = req.params.id;
    if (req.params.id && req.params.email) {
      lms
        .getHash(id, { from: accounts[0] })
        .then(async (hash) => {
          console.log(hash);
          let data = await ipfs.files.get(hash);
          console.log(data);
          res.json({ status: "success", data: data[0].content });
          // });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.status(400).json({ status: "Failed", reason: "wrong input" });
    }
  });
  app.post("/send/", async (req, res) => {
    if (req.body.message) {
      try {
        let id = shortid.generate() + shortid.generate();
        const message = {
          id: 1213,
          message: req.body.message,
          to: req.body.to,
          from: accounts[0],
          value: req.body.price,
        };
        const response = await lms.setMessage(message, {
          from: accounts[0],
        });
        res.json({ status: "success", id: id });
      } catch (error) {
        if (error.reason) {
          res.status(400).json({ status: "Failed", reason: error.reason });
          return;
        }
        res.status(400).json({ status: "Failed", reason: "wrong input" });
        console.log(error);
      }
    } else {
      res.status(400).json({ status: "Failed", reason: "wrong input" });
    }
  });
  app.get("/get/:account", async (req, res) => {
    try {
      const response = await lms.getMessage(req.params.account, {
        from: accounts[1],
      });
      if (response === "") {
        res.json({ status: "sem dados", data: null });
        return;
      }
      const { id, message, from, value, to } = response;
      res.json({
        status: "success",
        data: {
          id,
          message,
          from,
          value,
          to,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ status: "Failed", reason: "wrong input" });
    }
  });
}

module.exports = routes;
