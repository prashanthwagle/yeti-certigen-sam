var AWS = require("aws-sdk");
AWS.config.update({ region: "ap-south-1" });
var docClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
//TODO: Check if checkArraysEqual is required or not. As i feel it is unnecessary computation
//TODO: Optionally we may need to do a regex test for the elements of the object

const QUEUE_URL =
  "https://sqs.ap-south-1.amazonaws.com/357550834183/Sample1.fifo";

function checkArraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  a.sort();

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

exports.lambdaHandler = async (event) => {
  let params = {};
  let failedCertificates = [];
  const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

  const eventBody = JSON.parse(event["body"]);

  const certificateData = eventBody["certificatedata"];
  const certificateType = eventBody["certificatetype"];

  //Get the Certificate Columns by GETting certificateType
  const certificateHeaders = ["name", "title", "score", "doc"].sort();

  //Dispatch everything to the lambda to generate the PDF
  certificateData.forEach((certificate) => {
    if (checkArraysEqual(Object.keys(certificate), certificateHeaders)) {
      //Push it to the queue
      params["MessageAttributes"] = {
        name: {
          DataType: "String",
          StringValue: certificate["name"],
        },
      };

      params["MessageBody"] = JSON.stringify(certificate);
      params["MessageDeduplicationId"] = certificate["name"] + Math.random();
      params["MessageGroupId"] = certificate["title"];
      params["QueueUrl"] = QUEUE_URL;

      console.log("Sending mesages now", certificate);

      sqs.sendMessage(params, function (err, data) {
        if (err) {
          console.log("Error", err);
          failedCertificates.push(certificate);
        } else {
          console.log("Success", data);
        }
      });
    } else {
      failedCertificates.push(certificate);
    }
    params = {};
  });

  if (failedCertificates.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        error: false,
        message: "Dispatched all certificates for print",
      }),
    };
  } else {
    return {
      statusCode: 207,
      body: JSON.stringify({
        error: true,
        message: "Some certificates couldn't be dispatched",
        data: failedCertificates,
      }),
    };
  }
};
