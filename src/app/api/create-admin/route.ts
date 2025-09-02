import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET (request: NextRequest) {
	try {
		// 使用正確的 Better Auth admin API 創建用戶
		// 參考: https://www.better-auth.com/docs/plugins/admin#create-user
		const newUser = await auth.api.createUser({
			body: {
				email: "admin@playhard.local", // required
				password: "admin123", // required
				name: "Admin", // required
				role: "admin",
				data: {
					username: "admin",
					displayUsername: "admin"
				},
			},
		});

		return NextResponse.json({
			message: "Admin user created successfully using Better Auth",
			user: newUser.user
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