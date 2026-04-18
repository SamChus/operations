import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json({ limit: "15mb" }));
app.use(bodyParser.json()); //use body-parser middleware to parse JSON request bodies

const uri = "mongodb://admin:password@localhost:27017";
const client = new MongoClient(uri);
const db = client.db("user-account");
const userCollection = db.collection("user");

function parseProfilePic(profilePic) {
  if (!profilePic || typeof profilePic !== "string") return null;
  const match = profilePic.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const [, contentType, base64Data] = match;
  return {
    data: Buffer.from(base64Data, "base64"),
    contentType,
  };
}

function formatProfile(profile) {
  if (!profile) return null;
  const formatted = {
    id: profile._id.toString(),
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone || "",
    birthday: profile.birthday || "",
    country: profile.country || "",
    bio: profile.bio || "",
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  if (profile.profilePic && profile.profilePic.data) {
    formatted.profilePic = `data:${profile.profilePic.contentType};base64,${profile.profilePic.data.toString("base64")}`;
  }

  return formatted;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await userCollection
      .find({}, {
        projection: {
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          country: 1,
          createdAt: 1,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const list = users.map((user) => ({
      id: user._id.toString(),
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      country: user.country || "",
      joined: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "",
    }));
    return res.json(list);
  } catch (error) {
    console.error("Fetch users error:", error);
    return res.status(500).json({ error: "Unable to list users" });
  }
});

app.get("/api/user-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json(formatProfile(user));
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({ error: "Unable to fetch profile" });
  }
});

app.post("/api/user-profile", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      birthday,
      country,
      bio,
      profilePic,
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "firstName, lastName and email are required" });
    }

    const profile = {
      firstName,
      lastName,
      email,
      phone: phone || "",
      birthday: birthday || "",
      country: country || "",
      bio: bio || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pic = parseProfilePic(profilePic);
    if (pic) {
      profile.profilePic = pic;
    }

    const result = await userCollection.insertOne(profile);
    return res.status(201).json({ id: result.insertedId.toString() });
  } catch (error) {
    console.error("Create user profile error:", error);
    return res.status(500).json({ error: "Unable to create user profile" });
  }
});

app.put("/api/user-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      birthday,
      country,
      bio,
      profilePic,
    } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid profile id" });
    }

    const update = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (birthday !== undefined) update.birthday = birthday;
    if (country !== undefined) update.country = country;
    if (bio !== undefined) update.bio = bio;

    const pic = parseProfilePic(profilePic);
    if (pic) {
      update.profilePic = pic;
    }

    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json({ id });
  } catch (error) {
    console.error("Update user profile error:", error);
    return res.status(500).json({ error: "Unable to update user profile" });
  }
});

async function startServer() {
  try {
    await client.connect();
    console.log("MongoDB connected");
    app.listen(3000, () => {
      console.log("Echo Incoming!!!");
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

startServer();

//check if db is connected
app.get("/check-db", async (req, res) => {
  try {
    await client.db("user-account").command({ ping: 1 });
    res.send("Database is connected!");
  } catch (error) {
    res.status(500).send("Database is not connected!");
  }
});


