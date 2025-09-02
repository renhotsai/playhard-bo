import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check if any admin users already exist
    const existingAdmins = await prisma.user.findMany({
      where: {
        role: "admin"
      }
    });

    if (existingAdmins.length > 0) {
      return NextResponse.json(
        { error: "Admin users already exist. This endpoint is only for initial setup." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the first admin user directly in the database
    const adminUser = await prisma.user.create({
      data: {
        email,
        name: name || "Super Admin",
        role: "admin",
        emailVerified: true,
      }
    });

    // Create the password record
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: hashedPassword,
      }
    });

    return NextResponse.json({
      success: true,
      message: "First admin user created successfully",
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      }
    });

  } catch (error) {
    console.error("Create first admin error:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}