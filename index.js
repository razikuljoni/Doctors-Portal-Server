const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("doctors"));
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ktfxl.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
client.connect((err) => {
    console.log(err);
    const appointmentsCollection = client
        .db("doctors-portal")
        .collection("appointments");
    const doctorsCollection = client.db("doctors-portal").collection("doctors");

    app.post("/addAppointment", (req, res) => {
        const appointment = req.body;
        console.log(appointment);
        appointmentsCollection.insertOne(appointment).then((result) => {
            res.send(result.insertedCount > 0);
        });
    });

    app.post("/appointmentsByDate", (req, res) => {
        const date = req.body;
        console.log(date.date);
        appointmentsCollection
            .find({ date: date.date })
            .toArray((err, documents) => {
                res.send(documents);
            });
    });

    //!upload image on local folder
    // app.post("/addADoctor", (req, res) => {
    //     const file = req.files.file;
    //     const name = req.body.name;
    //     const email = req.body.email;
    //     const filePath = `${__dirname}/doctors/${file.name}`;
    //     file.mv(filePath, (err) => {
    //         if (err) {
    //             console.log(err);
    //             return res.status(500).send({ msg: "Faild to upload image" });
    //         }

    //         return res.send({ name: file.name, path: `/${file.name}` });
    //     });
    // });

    app.post("/addDoctor", (req, res) => {
        const file = req.files?.file;
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;
        const filePath = `${__dirname}/doctors/${file.name}`;
        console.log(file, name, email);
        file.mv(filePath, (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send({ msg: "Faild to upload image" });
            }

            const newFile = fs.readFileSync(filePath);
            const encImg = newFile.toString("base64");

            var image = {
                contentType: req.files.file.mimetype,
                size: req.files.file?.size,
                img: Buffer(encImg, "base64"),
            };
            doctorsCollection
                .insertOne({ name, email, phone, image })
                .then((result) => {
                    fs.remove(filePath, (err) => {
                        if (err) {
                            res.status(500).send({
                                msg: "Faild to upload image",
                            });
                        }
                    });
                    res.send(result.insertedCount > 0);
                });
        });
    });

    app.get("/doctors", (req, res) => {
        doctorsCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });
});

app.get("/", (req, res) => {
    res.send("Database Working successfully");
});

app.listen(process.env.PORT || 5000);
