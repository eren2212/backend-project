const mongoose = require("mongoose");
const Roles = require("../db/models/Roles");
const { CONNECTION_STRING } = require("../config");
const Enum = require("../config/Enum");

const defaultRoles = [
  {
    role_name: Enum.USER_ROLES.ADMIN,
    is_active: true,
  },
  {
    role_name: Enum.USER_ROLES.MANAGER,
    is_active: true,
  },
  {
    role_name: Enum.USER_ROLES.DEVELOPER,
    is_active: true,
  },
];

async function seedRoles() {
  try {
    // Connect to database
    await mongoose.connect(CONNECTION_STRING);
    console.log("Connected to MongoDB");

    // Check if roles already exist
    const existingRoles = await Roles.find({});
    if (existingRoles.length > 0) {
      console.log("Roles already exist. Skipping seed...");
      return;
    }

    // Create default roles
    for (const roleData of defaultRoles) {
      const existingRole = await Roles.findOne({
        role_name: roleData.role_name,
      });
      if (!existingRole) {
        const newRole = new Roles(roleData);
        await newRole.save();
        console.log(`✓ Created role: ${roleData.role_name}`);
      }
    }

    console.log("🎉 Default roles seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedRoles();
}

module.exports = seedRoles;
