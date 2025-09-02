import { Suspense } from "react";
import { SetUsernameForm } from "@/components/forms/set-username-form";

export default function SetUsernamePage(){
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
			<Suspense fallback={<div>Loading...</div>}>
				<SetUsernameForm />
			</Suspense>
		</div>
	)
}