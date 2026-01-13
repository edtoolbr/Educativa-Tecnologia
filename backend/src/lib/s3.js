const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.S3_BUCKET;

if (!BUCKET) {
  console.warn("S3_BUCKET is not set. S3 helpers will not work until it's configured.");
}

const s3 = new S3Client({ region: REGION });

async function createPresignedUploadUrl(key, contentType = "application/octet-stream", expiresIn = 60 * 5) {
  if (!BUCKET) throw new Error("S3_BUCKET environment variable is required");

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  return url;
}

async function getObjectStream(key) {
  if (!BUCKET) throw new Error("S3_BUCKET environment variable is required");
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const res = await s3.send(command);
  // res.Body is a stream in Node.js runtime
  return res.Body;
}

module.exports = {
  createPresignedUploadUrl,
  getObjectStream,
  s3Client: s3,
};
