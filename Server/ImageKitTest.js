import fs from "fs";
import dotenv from "dotenv";
import ImageKit from "imagekit";

dotenv.config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});
console.log({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKeyPrefix: process.env.IMAGEKIT_PRIVATE_KEY?.slice(0, 8),
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const file = fs.readFileSync("./package.json");

const result = await imagekit.upload({
    file,
    fileName: "package.json",
    folder: "/collix-test",
});

console.log(result);
