import express from "express";
import { SignupSchema } from "./types";
import { UserModel } from "./schema";

const app = express()

app.use(express.json());

app.post("/signup", async (req, res) => {
    const {success, data} = SignupSchema.safeParse(req.body)

    if (!success) {
        res.status(411).json({message: "Incorrect inputs"})
        return;
    }

    const userExists = await UserModel.findOne({
        username: data.username
    })

    if (userExists) {
        res.status(412).json({
            message: "User already exists with this username"
        })
        return 
    }

    const response = await UserModel.create({
        username: data.username,
        password: data.password
    })

    res.status(200).json({
        id: response._id
    });
})

app.post("/signin", (req, res) => {

})

app.listen(3001);