# Enabling CORS for Phoenix (Elixir)

To allow your React frontend to authenticate and communicate with your Phoenix backend, you must enable CORS (Cross-Origin Resource Sharing).

## 1. Add CORSPlug Dependency

Add to your `mix.exs`:

```
{:cors_plug, "~> 3.0"}
```

Then run:

```
mix deps.get
```

---

## 2. Configure CORS in Endpoint

In `lib/your_app_web/endpoint.ex`, add before your router plug:

```
plug CORSPlug,
  origin: ["http://localhost:8080"], # or ["*"] for all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  headers: ["Authorization", "Content-Type"],
  credentials: true
```

---

## 3. Ensure OPTIONS Route (if needed)

If you still get CORS errors, add this to your router:

```
options "/*path", YourAppWeb.CORSController, :options
```

And create a controller:

```
defmodule YourAppWeb.CORSController do
  use YourAppWeb, :controller

  def options(conn, _params) do
    send_resp(conn, 204, "")
  end
end
```
```

---

## 4. Restart Your Server

After making these changes, restart your Phoenix server.

---

## 5. Test

Your React app should now be able to authenticate and make API requests without CORS errors.

---

**Note:**
- Replace `YourAppWeb` with your actual app's web module name.
- Adjust the `origin` as needed for production.
