"use strict";

const { templates } = require("./mockdata");

const { PDFDocument } = require("pdf-lib");
const chromium = require("chrome-aws-lambda");

const AWS = require("aws-sdk");
AWS.config.update({ region: "ap-south-1" });
var docClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

//TODO: The Type of the template aka 'Template-1' etc must be specified in the message attributes

const QUEUE_URL =
  "https://sqs.ap-south-1.amazonaws.com/357550834183/Sample1.fifo";
const BUCKET_NAME = "ppwtestcertificates";
const CERTIFICATE_ID_LENGTH = 8;
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
      res = await docClient.putItem(params).promise();
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
    res = await docClient.updateItem(params).promise();
    return { error: false };
  } catch (err) {
    return { error: true, message: err.code };
  }
}

exports.lambdaHandler = async (event) => {
  const data = event["Records"][0];

  let TEMPLATE_NAME = "Template-1";

  const lengthOfRecords = event["Records"].length;

  const certificateData = JSON.parse(data.body);

  //Get the Certificate Template Data (Some changes to be done according to the ToDo)
  let template = templates["Template-1"];

  let templateFields = template.fields;
  let templateMarkup = template.markup;

  const certificateID = getCertificateID();

  await updateLifecycle(certificateID, TEMPLATE_NAME, 0);

  templateFields.forEach((field) => {
    templateMarkup = templateMarkup.replace(
      "$" + field.toUpperCase() + "$",
      certificateData[field]
    );
  });

  //Open Puppeteer and Print the PDF

  const pdfdata = await getPDFData(templateMarkup);

  await updateLifecycle(certificateID, TEMPLATE_NAME, 1);

  const pdfDoc = await PDFDocument.load(pdfdata, {
    updateMetadata: true,
  });

  pdfDoc.setTitle(
    "Participation Certificate of Ethnus Codemithra JOSH Scholarship Test"
  );
  pdfDoc.setAuthor("Ethnus Codemithra");
  pdfDoc.setSubject(
    `Ethnus Codemithra Certificate with CertificateID ${certificateID}and signature (hashed ID)`
  );
  pdfDoc.setCreator("Ethnus Codemithra");

  const pdfBytes = await pdfDoc.save();

  await updateLifecycle(certificateID, TEMPLATE_NAME, 2);

  let params = {
    Bucket: BUCKET_NAME,
    Key:
      "Ethnus_Codemithra_SAMPLE_Certificate-" +
      certificateID.toUpperCase() +
      Math.random() +
      ".pdf",
    Body: Buffer.from(pdfBytes),
    StorageClass: "STANDARD_IA",
  };

  let res = {};

  try {
    const s3 = new AWS.S3();
    let s3Res = await s3.upload(params).promise();
    console.log("complete:", s3Res);
    await updateLifecycle(certificateID, TEMPLATE_NAME, 3);
    Object.assign(res, s3Res);
  } catch (err) {
    await updateLifecycle(certificateID, TEMPLATE_NAME, -1);
    console.log("error:", err);
  }

  console.log("Length of the records is ", lengthOfRecords);
};

const getPDFData = async (html) => {
  let browser, pdf;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    page.setContent(html);

    pdf = await page.pdf({
      printBackground: true,
      width: "3210px",
      height: "2220px",
      pageRanges: "1",
    });

    //await page.waitFor(3000);
  } catch (err) {
    console.lof("ERROR");
    console.log(err);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return pdf;
};

const getCertificateID = () => {
  const pool = "23456789BCDFGHJKLMNPQRSTVWXYZ";
  var result = "";
  for (var i = CERTIFICATE_ID_LENGTH; i > 0; i--)
    result += pool[Math.floor(Math.random() * pool.length)];
  return result;
};
