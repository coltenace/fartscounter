// ==========================================
// FARTSCOUNT
// Anonymous Blog
// ==========================================


// ACCESS CODE

const ACCESS_CODE = "FARTSCOUNT";


// STORAGE KEY

const STORAGE_KEY = "fartscount_posts";


// LOGIN STATE

const SESSION_KEY = "fartscount_logged_in";


// ELEMENTS

const loginScreen =
    document.getElementById("loginScreen");

const website =
    document.getElementById("website");

const codeInput =
    document.getElementById("codeInput");

const errorMessage =
    document.getElementById("errorMessage");

const postInput =
    document.getElementById("postInput");

const characterCount =
    document.getElementById("characterCount");

const postsContainer =
    document.getElementById("posts");


// ==========================================
// LOGIN
// ==========================================

function login() {

    const enteredCode =
        codeInput.value.toUpperCase();

    if (enteredCode === ACCESS_CODE) {

        sessionStorage.setItem(
            SESSION_KEY,
            "true"
        );

        loginScreen.style.display = "none";

        website.classList.remove("hidden");

        loadPosts();

    } else {

        errorMessage.textContent =
            "Incorrect access code.";

        codeInput.value = "";

    }

}


// Allow pressing ENTER

codeInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            login();

        }

    }
);


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    sessionStorage.removeItem(
        SESSION_KEY
    );

    location.reload();

}


// ==========================================
// CHARACTER COUNTER
// ==========================================

postInput.addEventListener(
    "input",
    function() {

        characterCount.textContent =
            postInput.value.length +
            " / 1000";

    }
);


// ==========================================
// GET POSTS
// ==========================================

function getPosts() {

    const storedPosts =
        localStorage.getItem(STORAGE_KEY);

    if (!storedPosts) {

        return [];

    }

    return JSON.parse(storedPosts);

}


// ==========================================
// SAVE POSTS
// ==========================================

function savePosts(posts) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(posts)
    );

}


// ==========================================
// CREATE POST
// ==========================================

function createPost() {

    const content =
        postInput.value.trim();


    if (content === "") {

        return;

    }


    const posts =
        getPosts();


    const newPost = {

        id:
            Date.now().toString(),

        content:
            content,

        date:
            new Date().toISOString()

    };


    posts.push(newPost);


    savePosts(posts);


    postInput.value = "";

    characterCount.textContent =
        "0 / 1000";


    loadPosts();

}


// ==========================================
// DISPLAY POSTS
// ==========================================

function loadPosts() {

    const posts =
        getPosts();


    postsContainer.innerHTML = "";


    if (posts.length === 0) {

        postsContainer.innerHTML = `
            <p style="
                text-align:center;
                color:#666;
                padding:40px;
            ">
                No posts yet. Be the first.
            </p>
        `;

        return;

    }


    // Newest posts first

    posts.reverse();


    posts.forEach(function(post) {


        const postElement =
            document.createElement("article");

        postElement.className =
            "post";


        const info =
            document.createElement("div");

        info.className =
            "post-info";

        info.textContent =
            "Anonymous • " +
            formatDate(post.date);


        const content =
            document.createElement("p");

        content.className =
            "post-content";

        content.textContent =
            post.content;


        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "delete-button";

        deleteButton.textContent =
            "Delete this post";


        deleteButton.onclick =
            function() {

                deletePost(post.id);

            };


        postElement.appendChild(info);

        postElement.appendChild(content);

        postElement.appendChild(deleteButton);


        postsContainer.appendChild(
            postElement
        );

    });

}


// ==========================================
// DELETE POST
// ==========================================

function deletePost(id) {

    let posts =
        getPosts();


    posts =
        posts.filter(
            function(post) {

                return post.id !== id;

            }
        );


    savePosts(posts);


    loadPosts();

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
        SESSION_KEY
    ) === "true"
) {

    loginScreen.style.display =
        "none";

    website.classList.remove(
        "hidden"
    );

    loadPosts();

}
