const services = [
  {
    name: "Classic Haircut",
    durationMins: 30,
    price: 25,
    description: "A tailored haircut finished with a traditional hot towel neck clean-up.",
  },
  {
    name: "Skin Fade",
    durationMins: 45,
    price: 32,
    description: "A precise skin fade blended to suit your style and finished with detail work.",
  },
  {
    name: "Beard Trim",
    durationMins: 25,
    price: 20,
    description: "Shape and tidy your beard with clippers, scissors, and a clean neckline.",
  },
  {
    name: "Haircut and Beard",
    durationMins: 60,
    price: 42,
    description: "A complete haircut and beard shape-up in one appointment.",
  },
  {
    name: "Children's Haircut",
    durationMins: 30,
    price: 20,
    description: "A relaxed, age-appropriate haircut for children.",
  },
];

async function seed() {
  const [{ default: bcrypt }, { default: mongoose }, nextEnv] = await Promise.all([
    import("bcryptjs"),
    import("mongoose"),
    import("@next/env"),
  ]);

  nextEnv.default.loadEnvConfig(process.cwd());

  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "Salon Admin" } = process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI must be set before running the seed script.");
  }
  const email = ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Set ADMIN_EMAIL to a valid email address before running the seed script.");
  }
  const adminName = ADMIN_NAME.trim();
  if (adminName.length === 0 || adminName.length > 100) {
    throw new Error("ADMIN_NAME must be between 1 and 100 characters.");
  }
  const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      passwordHash: { type: String, required: true },
      role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer",
      },
    },
    { timestamps: true },
  );

  const serviceSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      durationMins: { type: Number, required: true },
      price: { type: Number, required: true },
      description: { type: String, required: true },
    },
    { timestamps: true },
  );

  const User = mongoose.models.User || mongoose.model("User", userSchema);
  const Service = mongoose.models.Service || mongoose.model("Service", serviceSchema);

  await mongoose.connect(MONGODB_URI);

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role !== "admin") {
        existingUser.role = "admin";
        await existingUser.save();
        console.log(`Promoted existing account ${email} to admin; its password was not changed.`);
      } else {
        console.log(`Admin account ${email} already exists; its password was not changed.`);
      }
    } else {
      if (
        !ADMIN_PASSWORD ||
        Buffer.byteLength(ADMIN_PASSWORD, "utf8") < 12 ||
        Buffer.byteLength(ADMIN_PASSWORD, "utf8") > 72
      ) {
        throw new Error(
          "ADMIN_PASSWORD must be between 12 and 72 UTF-8 bytes when creating a new admin account.",
        );
      }

      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await User.create({
        name: adminName,
        email,
        passwordHash,
        role: "admin",
      });
      console.log(`Created admin account ${email}.`);
    }

    for (const service of services) {
      await Service.updateOne(
        { name: service.name },
        { $setOnInsert: service },
        { upsert: true, runValidators: true },
      );
    }

    console.log(`Seeded ${services.length} sample services (existing services were left unchanged).`);
  } finally {
    await mongoose.disconnect();
  }
}

seed()
  .catch((error) => {
    console.error("Database seed failed:", error.message);
    process.exitCode = 1;
  });
