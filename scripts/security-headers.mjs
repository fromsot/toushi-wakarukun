// 配信先(Vercel / Cloudflare Pages)で共通して適用するセキュリティヘッダーの単一の定義元。
//
// vercel.json は Vercel がビルド前に読むためコミット済みの静的JSONのままにする必要があるが、
// 中身は buildVercelHeadersConfig() の出力と一致していなければならない。
// npm run check-headers がこの一致をCIで検証する。
//
// _headers (Cloudflare Pages形式) は静的に手で保守せず、build時に buildCloudflareHeadersFile()
// から dist/_headers として生成する。

const SUPABASE_PROJECT_HOST = "addkjzxqenzbtzfdedup.supabase.co";

function contentSecurityPolicy(){
    return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob: https://${SUPABASE_PROJECT_HOST}`,
        `connect-src 'self' https://${SUPABASE_PROJECT_HOST} wss://${SUPABASE_PROJECT_HOST} https://cdn.jsdelivr.net`,
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
    ].join("; ");
}

// 全パス(/(.*)) に適用する共通ヘッダー
const GLOBAL_HEADERS = [
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["X-Frame-Options", "DENY"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"],
    ["Content-Security-Policy", contentSecurityPolicy()]
];

// 特定パスにのみ追加するヘッダー(配列の順序がそのまま出力順になる)
const PATH_HEADERS = [
    ["/service-worker.js", [["Cache-Control", "no-cache"]]],
    ["/config.js", [["Cache-Control", "no-cache"]]],
    ["/manifest.webmanifest", [["Cache-Control", "public, max-age=3600"]]]
];

export function buildVercelHeadersConfig(){
    return [
        { source:"/(.*)", headers:GLOBAL_HEADERS.map(([key, value]) => ({ key, value })) },
        ...PATH_HEADERS.map(([source, headers]) => ({
            source,
            headers:headers.map(([key, value]) => ({ key, value }))
        }))
    ];
}

export function buildCloudflareHeadersFile(){
    const blocks = [
        ["/*", GLOBAL_HEADERS],
        ...PATH_HEADERS
    ];
    return blocks
        .map(([source, headers]) => [
            source,
            ...headers.map(([key, value]) => `  ${key}: ${value}`)
        ].join("\n"))
        .join("\n\n") + "\n";
}
