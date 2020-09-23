var AWS = require("aws-sdk");
AWS.config.update({ region: "ap-south-1" });
var docClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

//TODO:Complete the code for updating certificates and the respective metadata

const CERT_DATA_TABLE = "CertificateTable";
const CERT_META_TABLE = "MetaDataTable";

const insertToDatabase = async (params) => {
  try {
    res = await docClient.putItem(params).promise();
    return { error: false, data: res };
  } catch (err) {
    console.log(err);
    return { error: true, data: err };
  }
};

//To return
const missingParams = () => {
  return {
    statusCodeCode: 400,
    body: JSON.stringify({
      error: true,
      message: "Missing/Invalid Parameters",
    }),
  };
};

//Generic Code for getting all certificates.
//Used when someone's creating new certificate when it already exists
const getAllCertificates = async () => {
  var params = {
    TableName: CERT_DATA_TABLE,
  };

  try {
    res = await docClient.scan(params).promise();
    return { error: false, data: res };
  } catch (err) {
    console.log(err);
    return { error: true, data: err };
  }
};

/*
It will convert an object or an array of objects from the return type of aws-sdk to normal
Eg:
from {Title:{S: 'Prashanth'}} to {'Title': 'Prashanth'}
*/
const convertToReturnableType = (obj) => {
  let retValObj = {};
  const retValArr = [];
  if (!Array.isArray(obj)) {
    const keys = Object.keys(obj);
    keys.forEach((key) => {
      retValObj[key] = obj[key][Object.keys(obj[key])];
    });
    return retValObj;
  } else {
    obj.forEach((item) => {
      retValObj = {};
      const keys = Object.keys(item);
      keys.forEach((key) => {
        retValObj[key] = item[key][Object.keys(item[key])];
      });
      retValArr.push(retValObj);
    });
    return retValArr;
  }
};

exports.lambdaHandler = async (event) => {
  let response = {};
  let res;
  var route = event["requestContext"]["resourcePath"];
  var pathParameters = event["pathParameters"];
  var method = event["httpMethod"];
  switch (route) {
    case "/certigen/certificate/all":
      res = await getAllCertificates();
      console.log(res);
      if (!res.error) {
        response["statusCode"] = 200;
        response["body"] = JSON.stringify({
          error: false,
          data: convertToReturnableType(res.data["Items"]),
          count: res.data.Count,
        });
      } else {
        response["statusCode"] = res.data.statusCode;
        response["body"] = JSON.stringify({
          error: false,
          message: res.data.code,
        });
      }

      break;

    case "/certigen/certificate":
      if (method === "GET") {
        if (
          !event["queryStringParameters"] ||
          !event.queryStringParameters["type"]
        ) {
          response = missingParams();
        } else {
          var params = {
            TableName: CERT_DATA_TABLE,
            Key: {
              Type: {
                S: event["queryStringParameters"]["type"],
              },
            },
          };
          try {
            res = await docClient.getItem(params).promise();
            response["statusCode"] = 200;
            console.log(res);
            response["body"] = JSON.stringify({
              error: false,
              data: convertToReturnableType(res.Item),
            });
          } catch (err) {
            response["statusCode"] = err.statusCode;
            response["body"] = JSON.stringify({
              error: true,
              message: err.code,
            });
          }
        }
      } else if (method === "POST") {
        const eventBody = JSON.parse(event["body"]);

        var params = {
          Item: {
            Type: {
              S: eventBody["type"],
            },
            Fields: {
              SS: eventBody["fields"],
            },
            Markup: {
              S: eventBody["markup"],
            },
            Title: {
              S: eventBody["title"],
            },
          },
          TableName: CERT_DATA_TABLE,
        };

        const certificateTableResult = await insertToDatabase(params);

        if (certificateTableResult.data.code === "ValidationException") {
          response = missingParams();
        } else {
          response["statusCode"] = 400;
          response["body"] = JSON.stringify({
            error: true,
            message:
              certificateTableResult.data.code +
              " while updating CertificateData",
          });
        }

        params = {
          Item: {
            Type: {
              S: eventBody["type"],
            },
            Title: {
              S: eventBody["title"],
            },
            Author: {
              S: eventBody["author"],
            },
            Creator: {
              S: eventBody["creator"],
            },
          },
          TableName: CERT_META_TABLE,
        };

        const metaDataTableResult = await insertToDatabase(params);
        if (metaDataTableResult.error) {
          response["statusCode"] = metaDataTableResult.data.statusCode;
          if (metaDataTableResult.data.code === "ValidationException") {
            response = missingParams();
          } else {
            response["statusCode"] = 400;
            response["body"] = JSON.stringify({
              error: true,
              message:
                metaDataTableResult.data.code +
                " while updating CertificateData",
            });
          }
          break;
        }

        response["statusCode"] = 204;
        response["body"] = JSON.stringify({
          error: false,
          message: "Successful entry into the Database",
        });
      } else {
        response["statusCode"] = 400;
        response["body"] = JSON.stringify({
          error: true,
          message: "Unsupported Method",
        });
      }
      break;

    case "/certigen/certificate/{type}":
      const type = pathParameters["type"];
      if (!type) {
        return missingParams();
      }
      return {
        statusCode: 200,
        body: JSON.stringify({
          error: false,
          message: "Updation of Database in Progress",
        }),
      };
      break;

    case "/certigen/certificate/meta":
      if (
        !event["queryStringParameters"] ||
        !event.queryStringParameters["type"] ||
        !event.queryStringParameters["title"]
      ) {
        response = missingParams();
      } else {
        var params = {
          TableName: CERT_META_TABLE,
          Key: {
            Type: { S: event["queryStringParameters"]["type"] },
            Title: { S: event["queryStringParameters"]["title"] },
          },
        };

        try {
          res = await docClient.getItem(params).promise();
          response["statusCode"] = 200;
          response["body"] = JSON.stringify({
            error: false,
            data: convertToReturnableType(res.Item),
          });
        } catch (err) {
          console.log(err);
          response["statusCode"] = err.statusCode;
          if (err.code === "ValidationException") {
            response = missingParams();
          } else {
            response["body"] = JSON.stringify({
              error: true,
              message: err.code,
            });
          }
        }
      }
      break;

    default:
      response = {
        statusCode: 400,
        body: JSON.stringify({
          error: true,
          message: `Invalid case! ${route}`,
        }),
      };
  }

  return response;
};
