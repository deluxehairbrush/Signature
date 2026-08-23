"""
Signature Backend — Test Dashboard
A minimal Streamlit app for exercising every backend API endpoint.
"""

import json
import streamlit as st
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
API_BASE = st.sidebar.text_input("Backend URL", value="http://localhost:8000")
API = f"{API_BASE}/api/v1"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _headers():
    """Return auth headers if a token is in session state."""
    h = {"Content-Type": "application/json"}
    t = st.session_state.get("access")
    if t:
        h["Authorization"] = f"Bearer {t}"
    return h


def api(method, path, json_data=None, use_auth=True):
    """Thin wrapper around requests with error handling."""
    url = f"{API}{path}"
    headers = _headers() if use_auth else {"Content-Type": "application/json"}
    try:
        r = getattr(requests, method)(url, json=json_data, headers=headers, timeout=30)
        return r
    except requests.ConnectionError:
        st.error(f"Cannot connect to {url}. Is the backend running?")
        return None


def show_json(data, label="Response"):
    with st.expander(label, expanded=True):
        st.json(data)


# ---------------------------------------------------------------------------
# Sidebar — Auth state
# ---------------------------------------------------------------------------
st.sidebar.title("🔐 Auth")
if st.session_state.get("access"):
    st.sidebar.success(f"Logged in as **{st.session_state.get('username', '?')}**")
    st.sidebar.caption(f"User type: {st.session_state.get('user_type', '?')}")
    if st.sidebar.button("Logout"):
        token = st.session_state.get("refresh")
        if token:
            api("post", "/auth/logout/", {"refresh_token": token})
        for k in ("access", "refresh", "username", "user_type", "user_id"):
            st.session_state.pop(k, None)
        st.rerun()
else:
    st.sidebar.info("Not logged in")

# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------
page = st.sidebar.radio(
    "Navigate",
    [
        "1️⃣  Register / Login",
        "2️⃣  My Dashboard",
        "3️⃣  Create & Manage Deals",
        "4️⃣  Deal Lifecycle",
        "5️⃣  Search Freelancers",
        "6️⃣  AI Tools",
        "7️⃣  Public Profiles & Badges",
        "8️⃣  Tags",
        "9️⃣  Raw API Tester",
    ],
)

# ============================= 1. AUTH =====================================
if page.startswith("1"):
    st.header("Register / Login")

    tab_reg, tab_login, tab_me = st.tabs(["Register", "Login", "Me"])

    with tab_reg:
        with st.form("register"):
            c1, c2 = st.columns(2)
            email = c1.text_input("Email", "test@example.com")
            username = c1.text_input("Username", "testuser")
            user_type = c2.selectbox("Type", ["FREELANCER", "CLIENT"])
            first = c2.text_input("First name", "Test")
            last = c2.text_input("Last name", "User")
            pw = c1.text_input("Password", type="password", value="SecurePass123!")
            pw2 = c2.text_input("Confirm", type="password", value="SecurePass123!")
            if st.form_submit_button("Register"):
                r = api("post", "/auth/register/", {
                    "email": email,
                    "username": username,
                    "user_type": user_type,
                    "first_name": first,
                    "last_name": last,
                    "password": pw,
                    "password_confirm": pw2,
                }, use_auth=False)
                if r and r.ok:
                    st.success("Registered! Now login.")
                elif r:
                    st.error(r.text)

    with tab_login:
        with st.form("login"):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            if st.form_submit_button("Login"):
                r = api("post", "/auth/login/", {
                    "email": email,
                    "password": password,
                }, use_auth=False)
                if r and r.ok:
                    data = r.json()
                    st.session_state["access"] = data["access"]
                    st.session_state["refresh"] = data["refresh"]
                    # Fetch user info
                    me = api("get", "/auth/me/")
                    if me and me.ok:
                        me_data = me.json()
                        st.session_state["username"] = me_data.get("username", "")
                        st.session_state["user_type"] = me_data.get("user_type", "")
                        st.session_state["user_id"] = me_data.get("id")
                    st.success("Logged in!")
                    st.rerun()
                elif r:
                    st.error(r.text)

    with tab_me:
        if st.button("GET /auth/me/"):
            r = api("get", "/auth/me/")
            if r:
                show_json(r.json())

# ============================= 2. DASHBOARD =================================
elif page.startswith("2"):
    st.header("My Dashboard")
    c1, c2 = st.columns(2)
    with c1:
        if st.button("Freelancer Dashboard"):
            r = api("get", "/dashboard/freelancer/")
            if r:
                show_json(r.json(), "Freelancer Dashboard")
    with c2:
        if st.button("Client Dashboard"):
            r = api("get", "/dashboard/client/")
            if r:
                show_json(r.json(), "Client Dashboard")

    st.divider()
    st.subheader("Profile Management")
    ut = st.session_state.get("user_type", "")
    if ut == "FREELANCER":
        with st.expander("Create / Update Freelancer Profile"):
            with st.form("fl_profile"):
                display_name = st.text_input("Display Name", "Alice Developer")
                headline = st.text_input("Headline", "Full-Stack Developer")
                bio = st.text_area("Bio", "I build great things.")
                loc = st.text_input("Location", "San Francisco")
                rate = st.number_input("Hourly Rate", value=75.0)
                currency = st.selectbox("Currency", ["USD", "INR", "EUR", "GBP"])
                avail = st.selectbox("Availability", ["AVAILABLE", "BUSY", "UNAVAILABLE"])
                hours = st.text_input("Working Hours", "Mon-Fri 9AM-5PM PST")
                tags = st.text_input("Tags (comma-separated)", "Python, Django, React")
                if st.form_submit_button("Save Profile"):
                    payload = {
                        "display_name": display_name,
                        "headline": headline,
                        "bio": bio,
                        "location": loc,
                        "hourly_rate": rate,
                        "currency": currency,
                        "availability_status": avail,
                        "working_hours": hours,
                    }
                    # Try PATCH first (update), fall back to POST (create)
                    r = api("patch", "/freelancers/profile/", payload)
                    if r and not r.ok:
                        r = api("post", "/freelancers/profile/", payload)
                    if r and r.ok:
                        st.success("Profile saved!")
                        show_json(r.json())
                    elif r:
                        st.error(r.text)
    elif ut == "CLIENT":
        with st.expander("Create / Update Client Profile"):
            with st.form("cl_profile"):
                company = st.text_input("Company Name", "Acme Inc")
                desc = st.text_area("Description", "We build products.")
                website = st.text_input("Website", "https://acme.com")
                loc = st.text_input("Location", "New York")
                industry = st.text_input("Industry", "Technology")
                if st.form_submit_button("Save Profile"):
                    payload = {
                        "company_name": company,
                        "description": desc,
                        "website": website,
                        "location": loc,
                        "industry": industry,
                    }
                    r = api("patch", "/clients/profile/", payload)
                    if r and not r.ok:
                        r = api("post", "/clients/profile/", payload)
                    if r and r.ok:
                        st.success("Profile saved!")
                        show_json(r.json())
                    elif r:
                        st.error(r.text)
    else:
        st.info("Login as FREELANCER or CLIENT to manage a profile.")

# ============================= 3. CREATE DEALS =============================
elif page.startswith("3"):
    st.header("Create & Manage Deals")

    with st.form("create_deal"):
        title = st.text_input("Title", "E-commerce Website Build")
        desc = st.text_area("Description", "Build a full e-commerce site with 50 products.")
        scope = st.text_area("Scope", "Frontend + backend + payment integration")
        deliverables = st.text_area("Deliverables", "Fully deployed website, source code")
        compensation = st.number_input("Compensation", value=4500.0)
        currency = st.selectbox("Currency", ["USD", "INR", "EUR"])
        deadline = st.date_input("Deadline")
        hours = st.text_input("Working Hours", "Full-time")
        fl_username = st.text_input("Freelancer username (leave blank for draft)", "")
        if st.form_submit_button("Create Deal"):
            payload = {
                "title": title,
                "description": desc,
                "scope": scope,
                "deliverables": deliverables,
                "compensation_amount": compensation,
                "currency": currency,
                "deadline": deadline.isoformat(),
                "working_hours": hours,
            }
            if fl_username:
                payload["freelancer_username"] = fl_username
            r = api("post", "/deals/", payload)
            if r and r.ok:
                st.success("Deal created!")
                show_json(r.json())
            elif r:
                st.error(r.text)

    st.divider()
    st.subheader("My Deals")
    if st.button("Refresh"):
        st.rerun()
    r = api("get", "/deals/")
    if r and r.ok:
        data = r.json()
        deals = data.get("results", data) if isinstance(data, dict) else data
        if not deals:
            st.info("No deals yet.")
        for deal in deals:
            did = deal.get("public_id", deal.get("id"))
            status = deal.get("status", "?")
            with st.expander(f"**{deal.get('title', 'Untitled')}** — {status} ({str(did)[:8]}…)", expanded=False):
                st.json(deal)

# ============================= 4. DEAL LIFECYCLE ===========================
elif page.startswith("4"):
    st.header("Deal Lifecycle")
    st.caption("Propose → Accept → Sign → Complete")

    deal_id = st.text_input("Deal ID (UUID)", placeholder="paste deal public_id here")
    action = st.radio(
        "Action",
        ["propose", "accept", "sign", "complete", "cancel", "dispute"],
        horizontal=True,
    )

    # Extra fields for propose
    extra = {}
    if action == "propose":
        fl_user = st.text_input("Freelancer username to propose to")
        if fl_user:
            extra["freelancer_username"] = fl_user

    if st.button(f"POST /deals/{{id}}/{action}/"):
        if not deal_id.strip():
            st.warning("Enter a deal ID first.")
        else:
            r = api("post", f"/deals/{deal_id.strip()}/{action}/", extra or None)
            if r:
                show_json(r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "text": r.text})

    st.divider()
    st.subheader("Deal Proof of Record")
    if st.button("GET Proof"):
        if deal_id.strip():
            r = api("get", f"/deals/{deal_id.strip()}/proof/")
            if r:
                show_json(r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "text": r.text}, "Proof")
        else:
            st.warning("Enter a deal ID first.")

    st.divider()
    st.subheader("Completion Confirmation")
    with st.form("completion"):
        on_time = st.checkbox("Completed on time?", True)
        fair = st.checkbox("Fair compensation?", True)
        satisfactory = st.checkbox("Work satisfactory?", True)
        comment = st.text_area("Comment", "")
        if st.form_submit_button("Submit Confirmation"):
            if deal_id.strip():
                r = api("post", f"/deals/{deal_id.strip()}/completion/", {
                    "completed_on_time": on_time,
                    "compensation_received": fair,
                    "compensation_fair": fair,
                    "work_satisfactory": satisfactory,
                    "comment": comment,
                })
                if r:
                    show_json(r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "text": r.text})
            else:
                st.warning("Enter a deal ID first.")

# ============================= 5. SEARCH ===================================
elif page.startswith("5"):
    st.header("Search Freelancers")

    with st.form("search_fl"):
        c1, c2, c3 = st.columns(3)
        search = c1.text_input("Keyword search")
        tags = c2.text_input("Tags (comma-separated)")
        avail = c3.selectbox("Availability", ["", "AVAILABLE", "BUSY", "UNAVAILABLE"])
        c4, c5, c6 = st.columns(3)
        min_rate = c4.number_input("Min rate", value=0.0)
        max_rate = c5.number_input("Max rate", value=0.0)
        min_rep = c6.number_input("Min reputation", value=0, max_value=100)
        if st.form_submit_button("Search"):
            params = {}
            if search:
                params["search"] = search
            if tags:
                params["tags"] = tags
            if avail:
                params["availability_status"] = avail
            if min_rate > 0:
                params["min_rate"] = min_rate
            if max_rate > 0:
                params["max_rate"] = max_rate
            if min_rep > 0:
                params["min_reputation"] = min_rep
            qs = "&".join(f"{k}={v}" for k, v in params.items())
            r = api("get", f"/freelancers/?{qs}", use_auth=False)
            if r:
                show_json(r.json(), "Search Results")

    st.divider()
    st.subheader("Search Clients")
    with st.form("search_cl"):
        c1, c2 = st.columns(2)
        search_c = c1.text_input("Keyword")
        industry = c2.text_input("Industry")
        if st.form_submit_button("Search Clients"):
            params = {}
            if search_c:
                params["search"] = search_c
            if industry:
                params["industry"] = industry
            qs = "&".join(f"{k}={v}" for k, v in params.items())
            r = api("get", f"/clients/?{qs}", use_auth=False)
            if r:
                show_json(r.json(), "Client Results")

# ============================= 6. AI TOOLS =================================
elif page.startswith("6"):
    st.header("AI Tools")

    tab_sum, tab_rf = st.tabs(["Summarize Deal", "Red Flags"])

    with tab_sum:
        st.subheader("Chat → Contract Summary")
        raw = st.text_area(
            "Paste chat transcript or OCR text",
            height=200,
            value="Client: I need a website for my store, 50 products\nFreelancer: I can do it for $4500\nClient: Done, let's go\nFreelancer: Great, deadline 2 weeks, 50% upfront",
        )
        if st.button("Summarize"):
            r = api("post", "/ai/summarize-deal/", {"raw_text": raw})
            if r:
                show_json(r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "text": r.text}, "Summary")

    with tab_rf:
        st.subheader("Red Flag Detection")
        st.caption("Fill in deal fields to check for issues")
        with st.form("redflags"):
            c1, c2 = st.columns(2)
            scope = c1.text_input("Scope", "Build a website")
            price = c2.number_input("Price", value=0.0)
            currency = c2.selectbox("Currency", ["INR", "USD", "EUR"])
            deadline = c1.text_input("Deadline", "")
            payment = c1.text_input("Payment Terms", "")
            revisions = c2.text_input("Revisions", "")
            confidence = st.selectbox("Confidence", ["high", "medium", "low"])
            missing = st.text_input("Missing fields (comma-separated)", "price, deadline")
            if st.form_submit_button("Check Red Flags"):
                payload = {
                    "scope": scope,
                    "price": price if price > 0 else None,
                    "currency": currency,
                    "deadline": deadline or None,
                    "payment_terms": payment or None,
                    "revisions": revisions or None,
                    "confidence": confidence,
                    "missing_fields": [f.strip() for f in missing.split(",") if f.strip()],
                }
                r = api("post", "/ai/red-flags/", payload)
                if r:
                    show_json(r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "text": r.text}, "Red Flags")

# ============================= 7. PUBLIC PROFILES & BADGES ==================
elif page.startswith("7"):
    st.header("Public Profiles & Badges")

    username = st.text_input("Username")

    c1, c2, c3 = st.columns(3)
    with c1:
        if st.button("Public Freelancer Profile"):
            if username:
                r = api("get", f"/freelancers/{username}/", use_auth=False)
                if r:
                    show_json(r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "text": r.text})
            else:
                st.warning("Enter a username")

    with c2:
        if st.button("Badge SVG"):
            if username:
                st.markdown(f"![badge]({API_BASE}/api/v1/badges/{username}/)")
                st.code(f"{API_BASE}/api/v1/badges/{username}/")
            else:
                st.warning("Enter a username")

    with c3:
        if st.button("Badge JSON"):
            if username:
                r = api("get", f"/badges/{username}/json/", use_auth=False)
                if r:
                    show_json(r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "text": r.text})
            else:
                st.warning("Enter a username")

    st.divider()
    st.subheader("Reputation")
    if st.button("Get Reputation"):
        if username:
            r = api("get", f"/reputation/{username}/", use_auth=False)
            if r:
                show_json(r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "text": r.text})
        else:
            st.warning("Enter a username")

# ============================= 8. TAGS =====================================
elif page.startswith("8"):
    st.header("Tags")
    if st.button("List all tags"):
        r = api("get", "/tags/", use_auth=False)
        if r:
            show_json(r.json(), "Tags")

# ============================= 9. RAW API TESTER ===========================
elif page.startswith("9"):
    st.header("Raw API Tester")
    method = st.selectbox("Method", ["GET", "POST", "PATCH", "PUT", "DELETE"])
    path = st.text_input("Path", "/auth/me/")
    body = st.text_area("Body (JSON)", "{}", height=150)

    if st.button("Send"):
        json_data = None
        if method in ("POST", "PATCH", "PUT"):
            try:
                json_data = json.loads(body)
            except json.JSONDecodeError as e:
                st.error(f"Invalid JSON: {e}")
                json_data = None
        if json_data is not None or method == "GET" or method == "DELETE":
            r = api(method.lower(), path, json_data)
            if r:
                st.caption(f"Status: **{r.status_code}**")
                try:
                    show_json(r.json())
                except Exception:
                    st.text(r.text)
