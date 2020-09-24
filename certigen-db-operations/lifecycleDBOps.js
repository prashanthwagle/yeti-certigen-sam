var AWS = require("aws-sdk");
AWS.config.update({ region: "ap-south-1" });
var docClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

const LIFECYCLE_TABLE = "yetiCertigenLifeCycle";

async function updateLifecycle(certID, title, status) {
  let params = {};
  let res;
  if (status === 0) {
    params = {
      Item: {
        CertificateID: {
          S: certID,
        },
        Title: {
          S: title,
        },
        Status: {
          S: "0",
        },
      },
      TableName: LIFECYCLE_TABLE,
    };
    try {
      res = docClient.putItem(params).promise();
      return { error: false };
    } catch (err) {
      return { error: true, message: err.code };
    }
  }
  params = {
    ExpressionAttributeNames: {
      "#S": "Status",
    },
    ExpressionAttributeValues: {
      ":s": {
        S: String(status),
      },
    },
    Key: {
      CertificateID: {
        S: String(certID),
      },
    },
    TableName: LIFECYCLE_TABLE,
    UpdateExpression: "SET #S = :s",
  };

  try {
    res = docClient.updateItem(params).promise();
    return { error: false };
  } catch (err) {
    return { error: true, message: err.code };
  }
}

updateLifecycle("a", "Sample", 3);
