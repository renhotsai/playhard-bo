import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateRandomString } from "better-auth/crypto";

export async function GET () {
	try {
		// Step 1: Create user with temporary random password
		// This is the Better Auth compliant workaround for passwordless user creation
		// The random password is never stored or shown anywhere
		const temporaryPassword = generateRandomString(32); // Use Better Auth's crypto utility
		
		const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@playhard.local";
		const adminName = process.env.DEFAULT_ADMIN_NAME || "Admin";
		
		const newUser = await auth.api.createUser({
			body: {
				email: adminEmail,
				name: adminName,
				password: temporaryPassword, // temporary random password (never exposed)
				role: "admin",
				data: {
					username: "admin",
					displayUsername: "admin"
				},
			},
		});

		// Step 2: Immediately trigger password reset for first-time setup
		// This invalidates the temporary password and sends setup email
		const resetResult = await auth.api.forgetPassword({
			body: {
				email: adminEmail,
			},
		});

		if (!resetResult.status) {
			console.error("Failed to send password reset email");
			return NextResponse.json({
				error: "User created but failed to send setup email"
			}, { status: 207 }); // Partial success
		}

		return NextResponse.json({
			message: "Admin user created successfully. Password setup email sent.",
			user: newUser.user,
			setupRequired: true,
			note: "User must set password via email link before first login"
		});
	} catch (error) {
		console.error("Create admin error:", error);

		// Handle specific error types
		if (error instanceof Error) {
			if (error.message.includes("already exists")) {
				return NextResponse.json({
					error: "User with this email already exists"
				}, {status: 409});
			}

			return NextResponse.json({
				error: error.message
			}, {status: 400});
		}

		return NextResponse.json({
			error: "Internal server error"
		}, {status: 500});
	}
}