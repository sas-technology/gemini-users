const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.6J7r9mSE.js",app:"_app/immutable/entry/app.CQ9RMBxB.js",imports:["_app/immutable/entry/start.6J7r9mSE.js","_app/immutable/chunks/p6MXoyEn.js","_app/immutable/chunks/CgvtmLl6.js","_app/immutable/chunks/BW341vsq.js","_app/immutable/entry/app.CQ9RMBxB.js","_app/immutable/chunks/BW341vsq.js","_app/immutable/chunks/CgvtmLl6.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/COtxWNbX.js","_app/immutable/chunks/CN8CwkyU.js","_app/immutable/chunks/CYOP0bH8.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-UcfR2EdE.js')),
			__memo(() => import('./chunks/1-q86PlFh_.js')),
			__memo(() => import('./chunks/2-BsN4n5GX.js')),
			__memo(() => import('./chunks/3-B7cxF8CN.js')),
			__memo(() => import('./chunks/4-BkIZeiEq.js')),
			__memo(() => import('./chunks/5-C9vzE18-.js')),
			__memo(() => import('./chunks/6-DX_g3FhX.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/(dashboard)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-NnCnqXqk.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BaU9Fz00.js'))
			},
			{
				id: "/api/divisions",
				pattern: /^\/api\/divisions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BNQyKU9V.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-ChtLJ1XY.js'))
			},
			{
				id: "/api/students",
				pattern: /^\/api\/students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DHPcwUG_.js'))
			},
			{
				id: "/api/usage",
				pattern: /^\/api\/usage\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-10efFssd.js'))
			},
			{
				id: "/api/user",
				pattern: /^\/api\/user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-AD_pYkBx.js'))
			},
			{
				id: "/(dashboard)/divisions",
				pattern: /^\/divisions\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/(dashboard)/user",
				pattern: /^\/user\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
