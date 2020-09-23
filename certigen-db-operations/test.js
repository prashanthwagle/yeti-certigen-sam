var AWS = require("aws-sdk");
AWS.config.update({ region: "ap-south-1" });
var docClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

// (async function () {
//   var params = {
//     TableName: "CertificeTable",
//   };
//   try {
//     var x = await docClient.scan(params).promise();
//     console.log(JSON.stringify(x));

//     console.log(x["Items"]);
//   } catch (err) {
//     console.log(err);
//   }
// })();

// (async function () {
//   var params = {
//     Key: {
//       Type: {
//         S: "JOSH",
//       },
//     },
//     TableName: "CertificateTable",
//   };
//   try {
//     var x = await docClient.getItem(params).promise();
//     console.log(x);
//   } catch (err) {
//     console.log(err);
//   }
// })();

// (async function () {
//   var params = {
//     Item: {
//       Type: {
//         S: "Template-1",
//       },
//       Fields: {
//         SS: ["f1", "f2", "f3"],
//       },
//       Markup: {
//         S: "markup",
//       },
//       Title: {
//         S: "TitleByCodemithra",
//       },
//     },
//     TableName: "CertificateTable",
//     ReturnConsumedCapacity: "TOTAL",
//   };
//   try {
//     var x = await docClient.putItem(params).promise();
//     console.log(x);
//   } catch (err) {
//     console.log(err);
//   }
// })();

(async function () {
  params = {
    Item: {
      Type: {
        S: "few",
      },
      Title: {
        S: "few",
      },
      Author: {
        S: "few",
      },
      Creator: {
        S: "few",
      },
    },
    TableName: "MetaDataTable",
  };

  try {
    res = await docClient.putItem(params).promise();
    console.log(res);
  } catch (err) {
    console.log(err);
  }
})();
