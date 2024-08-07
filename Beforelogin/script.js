import axios from "axios";

import {api} from '../Config.js'
document.getElementById("loginForm").addEventListener("submit", async (event)=> {
    event.preventDefault()
    var email = document.getElementById("loginForm").email.value;
    var password = document.getElementById("loginForm").password.value;
    // login
    // test
    // test@gmail.com
    const response= await axios.post(`${api}/login`,{
        email,password
    })

    // Perform your login validation here, for example:
    if (response.status ==200) {
        alert("Login successful!");
        localStorage.setItem('user',JSON.stringify(response.data))
        window.location.replace('/');
    } else {
        // Display error message
        var errorMessage = document.querySelector(".error-message");
        errorMessage.textContent = "Invalid email or password.";
        event.preventDefault(); // Prevent the form from submitting
    }
});