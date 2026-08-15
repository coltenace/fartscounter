function json(data, status = 200) {

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers: {
                "Content-Type":
                    "application/json"
            }
        }
    );

}


// ==========================================
// CHECK ACCESS CODE
// ==========================================

function authorized(request, env) {

    const supplied =
        request.headers.get(
            "X-Access-Code"
        );

    if (!supplied) {
        return false;
    }

    return supplied === env.ACCESS_CODE;

}


// ==========================================
// SHA-256
// ==========================================

async function hashToken(token) {

    const data =
        new TextEncoder().encode(token);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hash)
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");

}


// ==========================================
// RANDOM TOKEN
// ==========================================

function randomToken() {

    return crypto.randomUUID() +
        crypto.randomUUID();

}


// ==========================================
// GET POSTS
// ==========================================

async function getPosts(request, env) {

    if (!authorized(request, env)) {

        return json(
            {
                error:
                    "Unauthorized"
            },
            401
        );

    }


    const result =
        await env.DB.prepare(`
            SELECT
                id,
                content,
                created_at
            FROM posts
            ORDER BY created_at DESC
            LIMIT 200
        `)
        .all();


    return json(
        result.results
    );

}


// ==========================================
// CREATE POST
// ==========================================

async function createPost(request, env) {

    if (!authorized(request, env)) {

        return json(
            {
                error:
                    "Unauthorized"
            },
            401
        );

    }


    let body;


    try {

        body =
            await request.json();

    } catch {

        return json(
            {
                error:
                    "Invalid JSON"
            },
            400
        );

    }


    const content =
        typeof body.content === "string"
            ? body.content.trim()
            : "";


    if (!content) {

        return json(
            {
                error:
                    "Post cannot be empty."
            },
            400
        );

    }


    if (content.length > 1000) {

        return json(
            {
                error:
                    "Post is too long."
            },
            400
        );

    }


    const id =
        crypto.randomUUID();


    const deleteToken =
        randomToken();


    const deleteTokenHash =
        await hashToken(
            deleteToken
        );


    await env.DB.prepare(`
        INSERT INTO posts
        (
            id,
            content,
            created_at,
            delete_token_hash
        )
        VALUES
        (?, ?, ?, ?)
    `)
    .bind(
        id,
        content,
        Date.now(),
        deleteTokenHash
    )
    .run();


    return json(
        {
            id: id,

            delete_token:
                deleteToken
        },
        201
    );

}


// ==========================================
// DELETE POST
// ==========================================

async function deletePost(
    request,
    env,
    id
) {

    if (!authorized(request, env)) {

        return json(
            {
                error:
                    "Unauthorized"
            },
            401
        );

    }


    const token =
        request.headers.get(
            "X-Delete-Token"
        );


    if (!token) {

        return json(
            {
                error:
                    "Missing delete token."
            },
            403
        );

    }


    const tokenHash =
        await hashToken(token);


    const result =
        await env.DB.prepare(`
            DELETE FROM posts
            WHERE id = ?
            AND delete_token_hash = ?
        `)
        .bind(
            id,
            tokenHash
        )
        .run();


    if (result.meta.changes === 0) {

        return json(
            {
                error:
                    "You cannot delete this post."
            },
            403
        );

    }


    return json(
        {
            success: true
        }
    );

}


// ==========================================
// ROUTER
// ==========================================

export async function onRequest(context) {

    const request =
        context.request;

    const env =
        context.env;

    const url =
        new URL(request.url);


    if (
        request.method === "GET"
        &&
        url.pathname === "/api/posts"
    ) {

        return getPosts(
            request,
            env
        );

    }


    if (
        request.method === "POST"
        &&
        url.pathname === "/api/posts"
    ) {

        return createPost(
            request,
            env
        );

    }


    if (
        request.method === "DELETE"
        &&
        url.pathname.startsWith(
            "/api/posts/"
        )
    ) {

        const id =
            url.pathname
                .split("/")
                .pop();


        return deletePost(
            request,
            env,
            id
        );

    }


    return json(
        {
            error:
                "Not found"
        },
        404
    );

}
