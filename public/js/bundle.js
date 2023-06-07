var $i2PN0$stripe = require("stripe");

/* eslint-disable*/ // import '@babel/polyfill';
/* eslint-disable*/ // import axios from 'axios';
/* eslint-disable*/ const $231df6283c3a14f5$export$516836c6a9dfc573 = ()=>{
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
};
const $231df6283c3a14f5$export$de026b00723010c1 = (type, msg)=>{
    $231df6283c3a14f5$export$516836c6a9dfc573();
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    window.setTimeout($231df6283c3a14f5$export$516836c6a9dfc573, 5000);
};


const $ebb897aeb5a4dbc4$export$596d806903d1f59e = async (email, password)=>{
    try {
        const response = await fetch("http://127.0.0.1:3000/api/v1/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error.message));
        }
        const data = await response.json();
        if (data.status === "success") {
            (0, $231df6283c3a14f5$export$de026b00723010c1)("success", "Logged in Successfully");
            window.setTimeout(()=>{
                location.assign("/");
            }, 1500);
        }
    } catch (err) {
        // console.log(err);
        (0, $231df6283c3a14f5$export$de026b00723010c1)("error", err.message);
    }
};
const $ebb897aeb5a4dbc4$export$a0973bcfe11b05c9 = async ()=>{
    try {
        const res = await fetch("http://127.0.0.1:3000/api/v1/users/logout", {
            method: "GET",
            credentials: "same-origin"
        });
        const data = await res.json();
        if (data.status === "success") location.reload(true);
    } catch (err) {
        console.log(err);
        (0, $231df6283c3a14f5$export$de026b00723010c1)("error", "ERROR Logging Out. Try Again!");
    }
};


/* eslint-disable*/ // import axios from 'axios';

const $deb821207cbddd03$export$f558026a994b6051 = async (data, type)=>{
    try {
        const url = type === "password" ? "http://127.0.0.1:3000/api/v1/users/updateMyPassword" : "http://127.0.0.1:3000/api/v1/users/updateMe";
        const res = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        const responseData = await res.json();
        console.log(responseData);
        if (responseData.status === "success") (0, $231df6283c3a14f5$export$de026b00723010c1)("success", `${type.toUpperCase()} Updated Successfully`);
    } catch (err) {
        console.log(err);
        (0, $231df6283c3a14f5$export$de026b00723010c1)("error", err.message);
    }
};


/* eslint-disable*/ // const axios = require('axios');


const $6fcfd34891a5155d$var$stripe = $i2PN0$stripe("pk_test_51NGHV5SCKbzTQ15oQiAIwkkHQKNEkzdAkPG7cQ8zLUNkGSwLsirEZbYX0h5Yd2o3kqtDsZiMwO3dpEvOiwgBXosn00jxpLtuio");
const $6fcfd34891a5155d$export$8d5bdbf26681c0c2 = async (tourId)=>{
    try {
        // 1) Get checkout session from API
        const response = await fetch(`http://127.0.0.1:3000/api/v1/bookings/${tourId}`);
        const session = await response.json();
        console.log(session);
        // 2) Get checkout form + charge credit card
        await $6fcfd34891a5155d$var$stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (error) {
        // Handle any errors
        console.log(error);
        (0, $231df6283c3a14f5$export$de026b00723010c1)("error", error);
    }
};


// DOM ELEMENTS
const $0bf1c808e3140ca5$var$loginForm = document.querySelector(".form--login");
const $0bf1c808e3140ca5$var$logOutBtn = document.querySelector(".nav__el--logout");
const $0bf1c808e3140ca5$var$userDataForm = document.querySelector(".form-user-data");
const $0bf1c808e3140ca5$var$userPasswordForm = document.querySelector(".form-user-password");
const $0bf1c808e3140ca5$var$bookBtn = document.getElementById("book-tour");
// DELEGATION
if ($0bf1c808e3140ca5$var$loginForm) $0bf1c808e3140ca5$var$loginForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    (0, $ebb897aeb5a4dbc4$export$596d806903d1f59e)(email, password);
});
if ($0bf1c808e3140ca5$var$logOutBtn) $0bf1c808e3140ca5$var$logOutBtn.addEventListener("click", (0, $ebb897aeb5a4dbc4$export$a0973bcfe11b05c9));
if ($0bf1c808e3140ca5$var$userDataForm) $0bf1c808e3140ca5$var$userDataForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    console.log(document.getElementById("photo").files[0]);
    (0, $deb821207cbddd03$export$f558026a994b6051)(form, "data");
});
if ($0bf1c808e3140ca5$var$userPasswordForm) $0bf1c808e3140ca5$var$userPasswordForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    document.querySelector(".btn--save-password").textContent = "Updating...";
    await (0, $deb821207cbddd03$export$f558026a994b6051)({
        passwordCurrent: passwordCurrent,
        password: password,
        passwordConfirm: passwordConfirm
    }, "password");
    document.querySelector(".btn--save-password").textContent = "Save password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
});
if ($0bf1c808e3140ca5$var$bookBtn) $0bf1c808e3140ca5$var$bookBtn.addEventListener("click", (e)=>{
    e.target.textContent = "Processing...";
    const { tourId: tourId  } = e.target.dataset;
    (0, $6fcfd34891a5155d$export$8d5bdbf26681c0c2)(tourId);
});


//# sourceMappingURL=bundle.js.map
