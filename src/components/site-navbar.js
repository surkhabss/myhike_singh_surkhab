import { logoutUser, onAuthReady } from "/src/authentication.js";

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
    this.renderAuthControls();
  }

  renderNavbar() {
    this.innerHTML = `
            <nav class="navbar navbar-expand-lg bg-primary" data-bs-theme="light">
                <div class="container-fluid">
                    <a class="navbar-brand" href="/">
                        <img src="/images/hikelogo.png" height="36" alt="">
                        Surkhab Hikes
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="/main.html">Hikes</a>
                            </li>
                            <li class="nav-item"><a class="nav-link" href="/addHike.html">Add hike</a></li>
                            <li class="nav-item"><a class="nav-link" href="/profile.html">Profile</a></li>
                        </ul>
                        <div id="authControls" class="auth-controls d-flex align-items-center gap-2 my-2 my-lg-0"></div>
                    </div>
                </div>
            </nav>
        `;
  }
  renderAuthControls() {
    const authControls = this.querySelector("#authControls");

    // Invisible placeholder prevents layout shifting while Firebase checks login status
    authControls.innerHTML = `<div class="btn btn-secondary" style="visibility: hidden; min-width: 80px;">Log out</div>`;

    onAuthReady(function (user) {

      if (user) {
        authControls.innerHTML = `<button class="btn btn-secondary" id="signOutBtn" type="button" style="min-width: 80px;">Log out</button>`;

        const signOutBtn = authControls.querySelector("#signOutBtn");
        signOutBtn.addEventListener("click", logoutUser);
      } else {
        authControls.innerHTML = `<a class="btn btn-secondary" id="loginBtn" href="/login.html" style="min-width: 80px;">Log in</a>`;
      }
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
