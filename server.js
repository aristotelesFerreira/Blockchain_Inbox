require("dotenv").config();

var express = require("express");
var app = express();

const routes = require("./routes");
const Web3 = require("web3");

const contract = require("truffle-contract");
const artifacts = require("./build/Inbox.json");

// const contract =require ('contrato de trufa');

app.use(express.json());

var mysql = require("mysql2");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "admin123",
  database: "music",
});

if (typeof web3 !== "undefined") {
  var web3 = new Web3(web3.currentProvider);
} else {
  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
}

const LMS = contract(artifacts);
LMS.setProvider(web3.currentProvider);

connection.connect(async (err, client) => {
  // const db = client.db("Cluster0");

  const accounts = await web3.eth.getAccounts();

  const lms = await LMS.deployed();
  //const lms = LMS.at(contract_address) for remote nodes deployed on ropsten or rinkeby

  routes(app, connection, lms, accounts);
  app.listen(process.env.PORT || 8082, () => {
    console.log("listening on port " + (process.env.PORT || 8082));
  });
});
