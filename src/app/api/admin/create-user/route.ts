import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { isSystemAdmin } from "@/lib/permissions";

/**
 * Authenticated admin user creation endpoint
 * Requires an existing admin session to create new admin users
 */
export async function POST(request: NextRequest) {
	try {
		// Get session from Better Auth
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session || !session.user) {
			return NextResponse.json({ 
				error: "Authentication required" 
			}, { status: 401 });
		}

		// Check if current user is system admin
		if (!isSystemAdmin(session.user.role)) {
			return NextResponse.json({ 
				error: "Admin privileges required" 
			}, { status: 403 });
		}

		const body = await request.json();
		const { email, password, name, role, username, emailVerified } = body;

		// Validate required fields
		if (!email || !password || !name || !username) {
			return NextResponse.json({ 
				error: "Missing required fields: email, password, name, username" 
			}, { status: 400 });
		}

		// Now use Better Auth's admin API with proper session context
		const newUser = await auth.api.admin.createUser({
			headers: request.headers, // Pass session headers
			body: {
				email,
				password,
				name,
				role: role || "user", // Default to regular user unless specified
				username,
				emailVerified: emailVerified || false,
			}
		});

		return NextResponse.json({
			message: "User created successfully",
			user: newUser
		});

	} catch (error) {
		console.error("Admin create user error:", error);
		
		if (error instanceof Error) {
			// Handle specific Better Auth API errors
			if (error.message.includes("already exists")) {
				return NextResponse.json({ 
					error: "User with this email already exists" 
				}, { status: 409 });
			}
			
			if (error.message.includes("UNAUTHORIZED")) {
				return NextResponse.json({ 
					error: "Invalid or expired session" 
				}, { status: 401 });
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