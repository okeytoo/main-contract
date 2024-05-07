const express = require("express");
const app = express();
const port = 3001;

express.json();

const metadatas = [];

app.get("/api/v1/nft/:id", (req, res) => {
    const identifier = req.params.id;

    if (!identifier || isNaN(identifier)) {
        return res.send({ message: "Invalid arguments" });
    }

    let metadata;

    if (metadatas[identifier]) {
        metadata = metadatas[identifier];
        metadata.cached = true;
    } else {
        metadata = {
            name: `Okeytoo Player #${identifier}`,
            description: "Okeytoo simple description...",
            image: `https://nftstorage.link/ipfs/bafybeiekz3gh7kwlw3bqijnc3st6ka2t3prvrrdupzrfmpox3ncz5fz4re/${identifier}.png`,
            date: Date.now(),
            cached: false,
            attributes: [
                {
                    trait_type: "Stars",
                    value: 1000,
                },
                {
                    trait_type: "Diamonds",
                    value: 100,
                },
                {
                    trait_type: "Bonus",
                    value: 20,
                },
            ],
        };
        metadatas[identifier] = metadata;
    }

    res.send(metadata);
});

app.post("/api/v1/nft/:id", (req, res) => {
    res.send({ message: "Not yet implemented" });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
