import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { isSystemAdmin } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    // Get current session - REQUIRED for admin API calls
    const session = await auth.api.getSession({
      headers: request.headers
    });

    // Validate admin authorization
    if (!session) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 });
    }

    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json({ 
        error: "Admin privileges required" 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, password, role, username } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: "Missing required fields: email, password, name" 
      }, { status: 400 });
    }

    // Use Better Auth admin API to create user WITH session headers
    const newUser = await auth.api.createUser({
      headers: request.headers, // Pass session headers for authentication
      body: {
        name,
        email,
        password,
        role: role || "user", // Default to regular user if not specified
        username,
        emailVerified: true // Admin-created users are auto-verified
      }
    });

    return NextResponse.json({
      message: "User created successfully",
      user: newUser
    });

  } catch (error) {
    console.error("Admin create user error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("UNAUTHORIZED")) {
        return NextResponse.json({ 
          error: "Admin session required to create users" 
        }, { status: 401 });
      }
      
      if (error.message.includes("already exists")) {
        return NextResponse.json({ 
          error: "User with this email already exists" 
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}