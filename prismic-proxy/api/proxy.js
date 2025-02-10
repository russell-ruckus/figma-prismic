import * as prismic from "@prismicio/client";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const client = prismic.createClient("figma-page-build-test", {
      accessToken: "MC5aNXdBZkJJQUFDZ0FMRDlI.77-9BgBHZ--_ve-_vSAtaV7vv71377-977-977-977-9C--_ve-_ve-_vRIHY3w8WUkU77-9YGA",
    });

    const documents = await client.get();
    return res.status(200).json(documents);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}