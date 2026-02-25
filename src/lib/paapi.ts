import crypto from "crypto";

type PAAPIConfig = {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  host: string;
  region: string;
};

function hmac(key: Buffer | string, data: string) {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function toAmzDate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const MM = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mm = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}${MM}${dd}T${hh}${mm}${ss}Z`;
}

function toDateStamp(amzDate: string) {
  return amzDate.slice(0, 8);
}

function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string) {
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  return kSigning;
}

export async function paapiGetItems(asins: string[]) {
  const cfg: PAAPIConfig = {
    accessKey: process.env.PAAPI_ACCESS_KEY!,
    secretKey: process.env.PAAPI_SECRET_KEY!,
    partnerTag: process.env.PAAPI_PARTNER_TAG!,
    host: process.env.PAAPI_HOST || "webservices.amazon.co.jp",
    region: process.env.PAAPI_REGION || "us-east-1",
  };

  const service = "ProductAdvertisingAPI";
  const amzDate = toAmzDate();
  const dateStamp = toDateStamp(amzDate);

  const endpoint = `https://${cfg.host}/paapi5/getitems`;
  const method = "POST";
  const contentType = "application/json; charset=utf-8";

  const payloadObj = {
    ItemIds: asins,
    Resources: [
      "Images.Primary.Large",
      "Images.Variants.Large",
      "ItemInfo.Title",
      "ItemInfo.Features",
      "Offers.Listings.Price",
    ],
    PartnerTag: cfg.partnerTag,
    PartnerType: "Associates",
    Marketplace: process.env.PAAPI_MARKETPLACE || "www.amazon.co.jp",
  };

  const payload = JSON.stringify(payloadObj);
  const payloadHash = sha256Hex(payload);

  const canonicalUri = "/paapi5/getitems";
  const canonicalQueryString = "";
  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:${contentType}\n` +
    `host:${cfg.host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${cfg.region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSignatureKey(cfg.secretKey, dateStamp, cfg.region, service);
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  const authorizationHeader =
    `${algorithm} Credential=${cfg.accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": contentType,
      host: cfg.host,
      "x-amz-date": amzDate,
      "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
      Authorization: authorizationHeader,
    },
    body: payload,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`PA-API error: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}