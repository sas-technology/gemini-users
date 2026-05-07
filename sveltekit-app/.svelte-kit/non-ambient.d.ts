
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/(dashboard)" | "/" | "/api" | "/api/auth" | "/api/auth/login" | "/api/auth/logout" | "/api/divisions" | "/api/health" | "/api/students" | "/api/usage" | "/api/user" | "/(dashboard)/divisions" | "/login" | "/(dashboard)/user";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/(dashboard)": Record<string, never>;
			"/": Record<string, never>;
			"/api": Record<string, never>;
			"/api/auth": Record<string, never>;
			"/api/auth/login": Record<string, never>;
			"/api/auth/logout": Record<string, never>;
			"/api/divisions": Record<string, never>;
			"/api/health": Record<string, never>;
			"/api/students": Record<string, never>;
			"/api/usage": Record<string, never>;
			"/api/user": Record<string, never>;
			"/(dashboard)/divisions": Record<string, never>;
			"/login": Record<string, never>;
			"/(dashboard)/user": Record<string, never>
		};
		Pathname(): "/" | "/api/auth/login" | "/api/auth/logout" | "/api/divisions" | "/api/health" | "/api/students" | "/api/usage" | "/api/user" | "/divisions" | "/login" | "/user";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}