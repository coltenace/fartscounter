const loginScreen =
    document.getElementById("loginScreen");

const website =
    document.getElementById("website");

const codeInput =
    document.getElementById("codeInput");

const loginButton =
    document.getElementById("loginButton");

const errorMessage =
    document.getElementById("errorMessage");

const logoutButton =
    document.getElementById("logoutButton");

const postInput =
    document.getElementById("postInput");

const postButton =
    document.getElementById("postButton");

const characterCount =
    document.getElementById("characterCount");

const postsContainer =
    document.getElementById("posts");


/*
    We intentionally do NOT put the access code
    in this JavaScript file.

    The server checks it using the Cloudflare
    environment variable ACCESS_CODE.
*/


// ==========================================
// LOGIN
// ==========================================

loginButton.addEventListener("click", login);

codeInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        login();
    }

});


async function login() {

    const code =
        codeInput.value.trim().toUpperCase();

    if (!code) {
        showError("Enter the access code.");
        return;
    }

    loginButton.disabled = true;

    loginButton.textContent = "Checking...";

    try {

        const response = await fetch("/api/posts", {

            headers: {
                "X-Access-Code": code
            }

        });


        if (!response.ok) {

            showError("Incorrect access code.");

            return;
        }


        sessionStorage.setItem(
            "fartscount_access",
            code
        );


        loginScreen.style.display = "none";

        website.classList.remove("hidden");


        await loadPosts();


    } catch (error) {

        showError(
            "Unable to connect to the server."
        );

    } finally {

        loginButton.disabled = false;

        loginButton.textContent = "Enter";

    }

}


// ==========================================
// ERROR
// ==========================================

function showError(message) {

    errorMessage.textContent = message;

}


// ==========================================
// LOGOUT
// ==========================================

logoutButton.addEventListener("click", function() {

    sessionStorage.removeItem(
        "fartscount_access"
    );

    location.reload();

});


// ==========================================
// CHARACTER COUNT
// ==========================================

postInput.addEventListener("input", function() {

    characterCount.textContent =
        postInput.value.length +
        " / 1000";

});


// ==========================================
// GET ACCESS CODE
// ==========================================

function getAccessCode() {

    return sessionStorage.getItem(
        "fartscount_access"
    );

}


// ==========================================
// LOAD POSTS
// ==========================================

async function loadPosts() {

    postsContainer.innerHTML = `
        <div class="loading">
            Loading posts...
        </div>
    `;


    try {

        const response = await fetch(
            "/api/posts",
            {
                headers: {
                    "X-Access-Code": getAccessCode()
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load posts"
            );

        }


        const posts =
            await response.json();


        displayPosts(posts);


    } catch (error) {

        postsContainer.innerHTML = `
            <div class="empty">
                Unable to load posts.
            </div>
        `;

    }

}


// ==========================================
// DISPLAY POSTS
// ==========================================

function displayPosts(posts) {

    postsContainer.innerHTML = "";


    if (posts.length === 0) {

        postsContainer.innerHTML = `
            <div class="empty">
                No posts yet. Be the first.
            </div>
        `;

        return;

    }


    posts.forEach(function(post) {

        const article =
            document.createElement("article");

        article.className = "post";


        const info =
            document.createElement("div");

        info.className = "post-info";

        info.textContent =
            "Anonymous • " +
            formatDate(post.created_at);


        const content =
            document.createElement("p");

        content.className =
            "post-content";

        content.textContent =
            post.content;


        article.appendChild(info);

        article.appendChild(content);


        if (post.can_delete) {

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "delete-button";

            deleteButton.textContent =
                "Delete this post";


            deleteButton.addEventListener(
                "click",
                function() {

                    deletePost(post.id);

                }
            );


            article.appendChild(
                deleteButton
            );

        }


        postsContainer.appendChild(
            article
        );

    });

}


// ==========================================
// CREATE POST
// ==========================================

postButton.addEventListener(
    "click",
    createPost
);


async function createPost() {

    const content =
        postInput.value.trim();


    if (!content) {
        return;
    }


    postButton.disabled = true;

    postButton.textContent =
        "Posting...";


    try {

        const response =
            await fetch(
                "/api/posts",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "X-Access-Code":
                            getAccessCode()
                    },

                    body: JSON.stringify({
                        content: content
                    })
                }
            );


        if (!response.ok) {

            const result =
                await response.json();

            throw new Error(
                result.error ||
                "Unable to create post"
            );

        }


        const result =
            await response.json();


        /*
            Save the private delete token
            for this post on this device.
        */

        if (result.delete_token) {

            localStorage.setItem(
                "delete_" + result.id,
                result.delete_token
            );

        }


        postInput.value = "";

        characterCount.textContent =
            "0 / 1000";


        await loadPosts();


    } catch (error) {

        alert(error.message);

    } finally {

        postButton.disabled = false;

        postButton.textContent =
            "Post Anonymously";

    }

}


// ==========================================
// DELETE POST
// ==========================================

async function deletePost(id) {

    const deleteToken =
        localStorage.getItem(
            "delete_" + id
        );


    if (!deleteToken) {

        alert(
            "This post can only be deleted from the device that created it."
        );

        return;

    }


    const confirmed =
        confirm(
            "Delete this post?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/posts/" + id,
                {
                    method: "DELETE",

                    headers: {
                        "X-Access-Code":
                            getAccessCode(),

                        "X-Delete-Token":
                            deleteToken
                    }
                }
            );


        if (!response.ok) {

            const result =
                await response.json();

            throw new Error(
                result.error ||
                "Unable to delete post"
            );

        }


        localStorage.removeItem(
            "delete_" + id
        );


        await loadPosts();


    } catch (error) {

        alert(error.message);

    }

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date) {

    return new Date(date)
        .toLocaleString();

}


// ==========================================
// AUTO LOGIN
// ==========================================

if (
    sessionStorage.getItem(
        "fartscount_access"
    )
) {

    loginScreen.style.display =
        "none";

    website.classList.remove(
        "hidden"
    );

    loadPosts();

}
